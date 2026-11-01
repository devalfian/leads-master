"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flag, RotateCcw, TriangleAlert, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { findNode, sortedBranches, validateGraph } from "@/lib/callbooks/graph";
import { getOutcome } from "@/lib/callbooks/outcomes";
import type { CallBranch, CallbookGraph } from "@/lib/callbooks/types";
import { cn, pluralise } from "@/lib/utils";

/**
 * Simulates a conversation against the *current draft* graph.
 * It never creates a call session and never touches saved data.
 */
export function CallbookPreview({
  callbookId,
  title,
  graph,
}: {
  callbookId: string;
  title: string;
  graph: CallbookGraph;
}) {
  const startNodeId = graph.startNodeId;
  const [visited, setVisited] = useState<string[]>(startNodeId ? [startNodeId] : []);
  const validation = useMemo(() => validateGraph(graph), [graph]);

  const currentNodeId = visited[visited.length - 1] ?? null;
  const currentNode = findNode(graph, currentNodeId);

  if (!startNodeId || !findNode(graph, startNodeId)) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Preview needs a starting step"
        description="Choose a starting step in the builder first. Preview follows the same graph the call will use."
        actions={
          <Button asChild>
            <Link href={`/callbooks/${callbookId}`}>Open builder</Link>
          </Button>
        }
      />
    );
  }

  if (!currentNode) {
    return (
      <div className="space-y-3">
        <Alert tone="danger" title="This conversation path is broken">
          The current step no longer exists in the graph. Restart the preview.
        </Alert>
        <Button variant="secondary" onClick={() => setVisited([startNodeId])}>
          <RotateCcw aria-hidden="true" />
          Restart preview
        </Button>
      </div>
    );
  }

  const branches = sortedBranches(currentNode);
  const isOutcome = currentNode.type === "outcome";
  const outcome = getOutcome(currentNode.outcomeKey);

  return (
    <div className="space-y-4">
      {validation.errors.length > 0 ? (
        <Alert
          tone="warning"
          title={`${pluralise(validation.errors.length, "error")} in this draft`}
        >
          Preview still works, but publishing is blocked. Open the builder and use “Checks” to see
          every issue.
        </Alert>
      ) : null}

      <div className="rounded-card border border-border-subtle bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-5 py-3">
          <div className="flex items-center gap-2">
            <Badge tone={isOutcome ? "success" : "accent"}>
              {isOutcome ? "Outcome" : "Message"}
            </Badge>
            <span className="text-[13px] font-medium text-foreground">
              {currentNode.title.trim() || "Untitled step"}
            </span>
          </div>
          <span className="text-[11px] text-muted">
            Step {visited.length} · draft preview, no call record is created
          </span>
        </div>

        <div className="px-5 py-6">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            {isOutcome ? "Closing line" : "Say this"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[17px] leading-relaxed text-foreground">
            {currentNode.script.trim() || "No script written for this step yet."}
          </p>

          {currentNode.internalNote ? (
            <div className="mt-4 rounded-[10px] border border-border-subtle bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Delivery note (only you)
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                {currentNode.internalNote}
              </p>
            </div>
          ) : null}
        </div>

        <PreviewFooter
          callbookId={callbookId}
          graph={graph}
          isOutcome={isOutcome}
          outcomeLabel={outcome ? outcome.label : null}
          branches={branches}
          onRestart={() => setVisited([startNodeId])}
          onAdvance={(nodeId) => setVisited((current) => [...current, nodeId])}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          disabled={visited.length <= 1}
          onClick={() => setVisited((current) => current.slice(0, -1))}
        >
          <ChevronLeft aria-hidden="true" />
          Back
        </Button>
        <Button variant="ghost" onClick={() => setVisited([startNodeId])}>
          <RotateCcw aria-hidden="true" />
          Restart
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/callbooks/${callbookId}`}>
            <X aria-hidden="true" />
            Exit preview
          </Link>
        </Button>
        <span className="ml-auto truncate text-[11px] text-muted">
          {title} · {pluralise(graph.nodes.length, "step")}
        </span>
      </div>
    </div>
  );
}

function PreviewFooter({
  callbookId,
  isOutcome,
  outcomeLabel,
  branches,
  graph,
  onRestart,
  onAdvance,
}: {
  callbookId: string;
  isOutcome: boolean;
  outcomeLabel: string | null;
  branches: CallBranch[];
  graph: CallbookGraph;
  onRestart: () => void;
  onAdvance: (nodeId: string) => void;
}) {
  if (isOutcome) {
    return (
      <div className="space-y-3 border-t border-border-subtle px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Flag className="size-4 text-success" aria-hidden="true" />
          <span className="text-[13px] font-medium text-foreground">Terminal step reached</span>
          {outcomeLabel ? <Badge tone="success">{outcomeLabel}</Badge> : null}
        </div>
        <p className="text-[12px] leading-relaxed text-secondary">
          In a real call this is where you end the call and record the result. Preview creates no
          call record.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRestart}>
            <RotateCcw aria-hidden="true" />
            Restart preview
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/callbooks/${callbookId}`}>Exit preview</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t border-border-subtle px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        What did the prospect say?
      </p>
      {branches.length === 0 ? (
        <p className="text-[12px] text-warning">
          This step has no responses yet, so the conversation stops here.
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {branches.map((branch) => {
          const target = findNode(graph, branch.nextNodeId);
          const example = branch.examplePhrases.find((phrase) => phrase.trim().length > 0);
          return (
            <button
              key={branch.id}
              type="button"
              disabled={!target}
              onClick={() => {
                if (target) onAdvance(target.id);
              }}
              className={cn(
                "rounded-[10px] border px-3.5 py-3 text-left transition-colors duration-150",
                target
                  ? "border-border-subtle bg-background/50 hover:border-accent-soft/60 hover:bg-accent/10"
                  : "cursor-not-allowed border-warning/30 bg-warning/5",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-foreground">
                  {branch.label.trim() || "Untitled response"}
                </span>
                <span className="text-[10px] text-muted">
                  {target ? `→ ${target.title.trim() || "Untitled step"}` : "Not connected"}
                </span>
              </span>
              {example ? (
                <span className="mt-1 block truncate text-[11px] italic text-muted">
                  “{example}”
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}