"use client";

import { useState } from "react";
import { MousePointerClick, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OUTCOMES } from "@/lib/callbooks/outcomes";
import { CALL_STEP_TYPES, CALL_STEP_TYPE_LABELS } from "@/lib/callbooks/types";
import { countIncomingBranches, displayTitle, findNode } from "@/lib/callbooks/graph";
import type { CallbookGraph, CallStepType } from "@/lib/callbooks/types";
import { BranchSection } from "./branch-section";

export type NodeInspectorProps = {
  graph: CallbookGraph;
  nodeId: string | null;
  focusedBranchId: string | null;
  onFocusBranch: (branchId: string) => void;
  onPatchNode: (patch: {
    title?: string;
    script?: string;
    internalNote?: string | null;
    outcomeKey?: string | null;
    stepType?: CallStepType | null;
    purpose?: string | null;
    talkingPoints?: string[];
  }) => void;
  onMakeStart: () => void;
  onDeleteNode: () => void;
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

export function NodeInspector(props: NodeInspectorProps) {
  const node = findNode(props.graph, props.nodeId);

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span className="flex size-10 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-muted">
          <MousePointerClick className="size-4" aria-hidden="true" />
        </span>
        <p className="text-[13px] font-medium text-foreground">No step selected</p>
        <p className="max-w-[240px] text-[12px] leading-relaxed text-secondary">
          Select a step on the canvas to edit its script and responses, or add a new step from the
          tools panel.
        </p>
      </div>
    );
  }

  const isMessage = node.type === "message";
  const isStart = props.graph.startNodeId === node.id;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isMessage ? "accent" : "success"}>
              {isMessage ? "Message" : "Outcome"}
            </Badge>
            {isStart ? <Badge tone="accent">Start</Badge> : null}
          </div>
          <p className="mt-1.5 truncate text-[13px] font-medium text-foreground">
            {displayTitle(node)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isStart ? (
            <Button variant="ghost" size="sm" onClick={props.onMakeStart}>
              Set as start
            </Button>
          ) : null}
          <DeleteNodeButton
            graph={props.graph}
            nodeId={node.id}
            nodeTitle={displayTitle(node) ?? "this step"}
            onDelete={props.onDeleteNode}
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <NodeFields {...props} isMessage={isMessage} />
      </div>
    </div>
  );
}

function NodeFields({
  isMessage,
  ...props
}: NodeInspectorProps & { isMessage: boolean }) {
  const node = findNode(props.graph, props.nodeId);
  if (!node) return null;

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="node-title">Step title</Label>
        <Input
          id="node-title"
          value={node.title}
          maxLength={120}
          placeholder="e.g. Opening"
          onChange={(event) => props.onPatchNode({ title: event.target.value })}
        />
        <FieldHint>Short enough to scan on the canvas.</FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-script">{isMessage ? "What you say" : "Closing line"}</Label>
        <Textarea
          id="node-script"
          value={node.script}
          rows={6}
          maxLength={8000}
          placeholder={
            isMessage
              ? "Write the line you will say at this point in the call."
              : "Optional: how you finish the call on this outcome."
          }
          onChange={(event) => props.onPatchNode({ script: event.target.value })}
          className="min-h-[140px]"
        />
        <FieldHint>{node.script.trim().length} characters</FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-note">Internal delivery note</Label>
        <Textarea
          id="node-note"
          value={node.internalNote ?? ""}
          rows={3}
          maxLength={4000}
          placeholder="Tone, pacing, or what to listen for. Only you see this."
          onChange={(event) => props.onPatchNode({ internalNote: event.target.value || null })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-step-type">Step type</Label>
        <Select
          id="node-step-type"
          value={node.stepType ?? ""}
          onChange={(event) =>
            props.onPatchNode({
              stepType: (event.target.value || null) as CallStepType | null,
            })
          }
        >
          <option value="">Not classified</option>
          {CALL_STEP_TYPES.map((stepType) => (
            <option key={stepType} value={stepType}>
              {CALL_STEP_TYPE_LABELS[stepType]}
            </option>
          ))}
        </Select>
        <FieldHint>
          An organisational label only — it never forces an order or blocks publishing.
        </FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-purpose">Purpose of this step</Label>
        <Textarea
          id="node-purpose"
          value={node.purpose ?? ""}
          rows={2}
          maxLength={2000}
          placeholder="e.g. Confirm the person can decide about the website."
          onChange={(event) => props.onPatchNode({ purpose: event.target.value || null })}
        />
        <FieldHint>Shown above the wording during a call, so you know why you are asking.</FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="node-talking-points">Talking points</Label>
        <Textarea
          id="node-talking-points"
          value={node.talkingPoints.join("\n")}
          rows={3}
          maxLength={2000}
          placeholder={"One point per line\ne.g. mention the menu and location page"}
          onChange={(event) =>
            props.onPatchNode({
              talkingPoints: event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(0, 20),
            })
          }
        />
        <FieldHint>Optional. One bullet per line; the spoken wording above stays the script.</FieldHint>
      </div>

      {isMessage ? (
        <BranchSection {...props} nodeId={node.id} />
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="node-outcome">Outcome category</Label>
          <Select
            id="node-outcome"
            value={node.outcomeKey ?? ""}
            onChange={(event) => props.onPatchNode({ outcomeKey: event.target.value || null })}
          >
            <option value="">Choose an outcome…</option>
            {OUTCOMES.map((outcome) => (
              <option key={outcome.key} value={outcome.key}>
                {outcome.label}
              </option>
            ))}
          </Select>
          <FieldHint>
            Terminal step — it has no prospect responses. This category is pre-selected when a call
            ends here.
          </FieldHint>
        </div>
      )}
    </>
  );
}

function DeleteNodeButton({
  graph,
  nodeId,
  nodeTitle,
  onDelete,
}: {
  graph: CallbookGraph;
  nodeId: string;
  nodeTitle: string;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const incoming = countIncomingBranches(graph, nodeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        title="Delete this step"
        aria-label={`Delete ${nodeTitle}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="text-danger" aria-hidden="true" />
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete “{nodeTitle}”?</DialogTitle>
          <DialogDescription>
            This removes the step and its responses from the draft. Saving is what makes the
            deletion permanent.
          </DialogDescription>
        </DialogHeader>

        {incoming.branchCount > 0 ? (
          <div className="mb-4 rounded-[10px] border border-warning/30 bg-warning/10 p-3 text-[12px] leading-relaxed text-warning">
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              {incoming.branchCount} response{incoming.branchCount === 1 ? "" : "s"} currently point
              here
            </p>
            <p className="mt-1 opacity-90">
              From: {incoming.nodeTitles.join(", ")}. Those responses will become unconnected — they
              are not redirected automatically.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
          >
            Delete step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}