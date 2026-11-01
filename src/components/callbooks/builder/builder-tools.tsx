"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
  Flag,
  MessageSquare,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ValidationResult } from "@/lib/callbooks/graph";
import { displayTitle, findNode } from "@/lib/callbooks/graph";
import type { CallbookGraph } from "@/lib/callbooks/types";
import { cn } from "@/lib/utils";

export function BuilderTools({
  graph,
  validation,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onAddMessage,
  onAddOutcome,
  onReviewChecks,
}: {
  graph: CallbookGraph;
  validation: ValidationResult;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onMoveNode: (nodeId: string, direction: -1 | 1) => void;
  onAddMessage: () => void;
  onAddOutcome: () => void;
  onReviewChecks: () => void;
}) {
  const startNode = findNode(graph, graph.startNodeId);
  const errorCount = validation.errors.length;
  const warningCount = validation.warnings.length;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-4">
      <section className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Add a step</h2>
        <Button variant="secondary" className="w-full justify-start" onClick={onAddMessage}>
          <MessageSquare aria-hidden="true" />
          Message step
        </Button>
        <p className="text-[11px] leading-relaxed text-muted">
          A line you say during the call. It can branch into several prospect responses.
        </p>
        <Button variant="secondary" className="w-full justify-start" onClick={onAddOutcome}>
          <Flag aria-hidden="true" />
          Outcome step
        </Button>
        <p className="text-[11px] leading-relaxed text-muted">
          A terminal step that ends a path, such as a booked meeting or a polite close.
        </p>
      </section>

      <section className="space-y-2 border-t border-border-subtle pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Steps ({graph.nodes.length})
        </h2>
        <ol className="space-y-1">
          {graph.nodes.map((node, index) => (
            <li
              key={node.id}
              className={cn(
                "flex items-center gap-1 rounded-[8px] border px-1.5 py-1",
                node.id === selectedNodeId
                  ? "border-accent/50 bg-accent/10"
                  : "border-border-subtle bg-background/40",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] text-foreground hover:text-accent-soft"
              >
                <span className="shrink-0 text-muted">{index + 1}.</span>
                <span className="truncate">{displayTitle(node)}</span>
                {graph.startNodeId === node.id ? (
                  <Badge tone="accent" className="shrink-0">
                    start
                  </Badge>
                ) : null}
                {node.type === "outcome" ? (
                  <Flag className="size-3 shrink-0 text-success" aria-hidden="true" />
                ) : null}
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Move step up"
                aria-label={`Move ${displayTitle(node)} up`}
                disabled={index === 0}
                onClick={() => onMoveNode(node.id, -1)}
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                title="Move step down"
                aria-label={`Move ${displayTitle(node)} down`}
                disabled={index === graph.nodes.length - 1}
                onClick={() => onMoveNode(node.id, 1)}
              >
                <ArrowDown aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ol>
        <p className="text-[11px] leading-relaxed text-muted">
          Order is for reading and saving only — branches decide the real path.
        </p>
      </section>

      <section className="space-y-2 border-t border-border-subtle pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Conversation
        </h2>
        <dl className="space-y-1.5 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">Starting step</dt>
            <dd className="truncate text-right text-foreground">
              {startNode ? displayTitle(startNode) : "Not set"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">Steps</dt>
            <dd className="text-foreground">{validation.stats.nodeCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">Responses</dt>
            <dd className="text-foreground">
              {validation.stats.connectedBranchCount} / {validation.stats.branchCount} connected
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">Outcomes</dt>
            <dd className="text-foreground">{validation.stats.outcomeNodeCount}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2 border-t border-border-subtle pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Checks</h2>
        {errorCount === 0 && warningCount === 0 ? (
          <p className="flex items-center gap-2 text-[12px] text-success">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Ready to publish
          </p>
        ) : (
          <div className="space-y-2">
            {errorCount > 0 ? (
              <p className="flex items-center gap-2 text-[12px] text-danger">
                <CircleAlert className="size-3.5" aria-hidden="true" />
                {errorCount} error{errorCount === 1 ? "" : "s"} to resolve
              </p>
            ) : null}
            {warningCount > 0 ? (
              <p className="flex items-center gap-2 text-[12px] text-warning">
                <TriangleAlert className="size-3.5" aria-hidden="true" />
                {warningCount} warning{warningCount === 1 ? "" : "s"}
              </p>
            ) : null}
            <Button variant="outline" size="sm" className="w-full" onClick={onReviewChecks}>
              Review checks
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-2 border-t border-border-subtle pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Legend</h2>
        <ul className="space-y-1.5 text-[11px] text-secondary">
          <li className="flex items-center gap-2">
            <Badge tone="accent">
              <MessageSquare className="size-3" aria-hidden="true" />
              Message
            </Badge>
            you speak
          </li>
          <li className="flex items-center gap-2">
            <Badge tone="success">
              <Flag className="size-3" aria-hidden="true" />
              Outcome
            </Badge>
            path ends
          </li>
          <li className="flex items-center gap-2">
            <Badge tone="warning">
              <TriangleAlert className="size-3" aria-hidden="true" />
              Unconnected
            </Badge>
            needs a next step
          </li>
          <li className="flex items-center gap-2">
            <Badge tone="accent">
              <Plus className="size-3 rotate-45" aria-hidden="true" />
              START
            </Badge>
            first step of the call
          </li>
        </ul>
      </section>
    </div>
  );
}