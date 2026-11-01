"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { findNode, sortedBranches } from "@/lib/callbooks/graph";
import type { CallbookGraph } from "@/lib/callbooks/types";
import { cn } from "@/lib/utils";

export type BranchSectionProps = {
  graph: CallbookGraph;
  nodeId: string;
  focusedBranchId: string | null;
  onFocusBranch: (branchId: string) => void;
  onAddBranch: () => void;
  onPatchBranch: (
    branchId: string,
    patch: { label?: string; examplePhrases?: string[]; nextNodeId?: string | null },
  ) => void;
  onDeleteBranch: (branchId: string) => void;
  onMoveBranch: (branchId: string, direction: -1 | 1) => void;
  onConnectBranch: (branchId: string, targetNodeId: string) => { ok: boolean; error?: string };
  onCreateNextStep: (branchId: string) => void;
};

export function BranchSection(props: BranchSectionProps) {
  const [connectErrors, setConnectErrors] = useState<Record<string, string>>({});
  const node = findNode(props.graph, props.nodeId);
  if (!node) return null;

  const branches = sortedBranches(node);
  const targets = props.graph.nodes.filter((candidate) => candidate.id !== node.id);

  function connect(branchId: string, targetNodeId: string) {
    if (!targetNodeId) {
      props.onPatchBranch(branchId, { nextNodeId: null });
      setConnectErrors((current) => {
        const next = { ...current };
        delete next[branchId];
        return next;
      });
      return;
    }

    const result = props.onConnectBranch(branchId, targetNodeId);
    setConnectErrors((current) => {
      const next = { ...current };
      if (result.ok) delete next[branchId];
      else next[branchId] = result.error ?? "That connection is not valid.";
      return next;
    });
  }

  return (
    <section className="space-y-3 border-t border-border-subtle pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-medium text-foreground">Possible prospect responses</h3>
          <p className="mt-0.5 text-[11px] text-muted">
            {branches.length === 0
              ? "Add at least one response so you know where to go next."
              : `${branches.length} response${branches.length === 1 ? "" : "s"} — each one decides the next step.`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={props.onAddBranch}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>

      {branches.length === 0 ? (
        <div className="rounded-[10px] border border-warning/30 bg-warning/10 p-3 text-[12px] leading-relaxed text-warning">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-3.5" aria-hidden="true" />
            This step has no responses
          </p>
          <p className="mt-1 opacity-90">
            Without responses the conversation cannot continue from here, and the Callbook cannot be
            published.
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {branches.map((branch, index) => {
          const target = findNode(props.graph, branch.nextNodeId);
          const error = connectErrors[branch.id];

          return (
            <div
              key={branch.id}
              className={cn(
                "rounded-[10px] border bg-background/40 p-3 transition-colors",
                props.focusedBranchId === branch.id
                  ? "border-accent-soft/70"
                  : "border-border-subtle",
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  Response {index + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Move up"
                    aria-label="Move response up"
                    disabled={index === 0}
                    onClick={() => props.onMoveBranch(branch.id, -1)}
                  >
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Move down"
                    aria-label="Move response down"
                    disabled={index === branches.length - 1}
                    onClick={() => props.onMoveBranch(branch.id, 1)}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove response"
                    aria-label={`Remove response ${index + 1}`}
                    onClick={() => props.onDeleteBranch(branch.id)}
                  >
                    <Trash2 className="text-danger" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <BranchFields
                branchId={branch.id}
                label={branch.label}
                examples={branch.examplePhrases}
                nextNodeId={branch.nextNodeId}
                targetTitle={target ? target.title.trim() || "Untitled step" : null}
                targets={targets}
                error={error}
                onFocus={() => props.onFocusBranch(branch.id)}
                onPatch={(patch) => props.onPatchBranch(branch.id, patch)}
                onConnect={(targetId) => connect(branch.id, targetId)}
                onCreateNextStep={() => props.onCreateNextStep(branch.id)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BranchFields({
  branchId,
  label,
  examples,
  nextNodeId,
  targetTitle,
  targets,
  error,
  onFocus,
  onPatch,
  onConnect,
  onCreateNextStep,
}: {
  branchId: string;
  label: string;
  examples: string[];
  nextNodeId: string | null;
  targetTitle: string | null;
  targets: CallbookGraph["nodes"];
  error?: string;
  onFocus: () => void;
  onPatch: (patch: { label?: string; examplePhrases?: string[] }) => void;
  onConnect: (targetNodeId: string) => void;
  onCreateNextStep: () => void;
}) {
  return (
    <div className="space-y-2" onFocus={onFocus}>
      <div className="space-y-1">
        <Label htmlFor={`branch-label-${branchId}`}>Label</Label>
        <Input
          id={`branch-label-${branchId}`}
          value={label}
          maxLength={120}
          placeholder="e.g. Busy"
          onChange={(event) => onPatch({ label: event.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`branch-examples-${branchId}`}>Example phrases</Label>
        <Textarea
          id={`branch-examples-${branchId}`}
          value={examples.join("\n")}
          rows={2}
          placeholder={"“I'm busy right now.”\n“Can you call me later?”"}
          className="min-h-[60px] text-[12px]"
          onChange={(event) =>
            onPatch({ examplePhrases: event.target.value.split("\n").slice(0, 30) })
          }
        />
        <FieldHint>One phrase per line. Helps you recognise the response live.</FieldHint>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`branch-target-${branchId}`}>Next step</Label>
        <Select
          id={`branch-target-${branchId}`}
          value={nextNodeId ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            if (!value) {
              onConnect("");
              return;
            }
            onConnect(value);
          }}
          aria-invalid={!nextNodeId || undefined}
          className={cn(!nextNodeId && "border-warning/60")}
        >
          <option value="">Not connected</option>
          {targets.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.type === "outcome" ? "Outcome · " : "Message · "}
              {candidate.title.trim() || "Untitled step"}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span
            className={cn(
              "flex items-center gap-1 text-[11px]",
              nextNodeId ? "text-secondary" : "text-warning",
            )}
          >
            {nextNodeId ? (
              <>
                <CornerDownRight className="size-3" aria-hidden="true" />
                Goes to {targetTitle ? `“${targetTitle}”` : "a missing step"}
              </>
            ) : (
              <>
                <TriangleAlert className="size-3" aria-hidden="true" />
                Not connected — this blocks publishing
              </>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={onCreateNextStep}>
            <Plus aria-hidden="true" />
            Create next step
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-[11px] leading-relaxed text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}