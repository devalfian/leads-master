"use client";

import { AlertTriangle, CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ValidationResult } from "@/lib/callbooks/graph";
import { pluralise } from "@/lib/utils";

export function ChecksDialog({
  open,
  onOpenChange,
  validation,
  onGoToNode,
  onPublish,
  publishing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validation: ValidationResult;
  onGoToNode: (nodeId: string) => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  const { stats, errors, warnings, ok } = validation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Conversation checks</DialogTitle>
          <DialogDescription>
            Errors must be resolved before publishing. Warnings are explained and can be accepted.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Steps" value={stats.nodeCount} />
          <Stat label="Messages" value={stats.messageNodeCount} />
          <Stat label="Outcomes" value={stats.outcomeNodeCount} />
          <Stat label="Responses" value={stats.branchCount} />
        </dl>

        <div className="mt-4 space-y-3">
          <IssueList
            tone="error"
            title={`${pluralise(errors.length, "error")}`}
            emptyLabel="No errors."
            issues={errors}
            onGoToNode={onGoToNode}
          />
          <IssueList
            tone="warning"
            title={`${pluralise(warnings.length, "warning")}`}
            emptyLabel="No warnings."
            issues={warnings}
            onGoToNode={onGoToNode}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onPublish} disabled={!ok} loading={publishing} title={ok ? undefined : "Resolve the errors first"}>
            Publish Callbook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] border border-border-subtle bg-background/50 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-[15px] font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function IssueList({
  tone,
  title,
  emptyLabel,
  issues,
  onGoToNode,
}: {
  tone: "error" | "warning";
  title: string;
  emptyLabel: string;
  issues: ValidationResult["errors"];
  onGoToNode: (nodeId: string) => void;
}) {
  const Icon = tone === "error" ? CircleAlert : AlertTriangle;
  const color = tone === "error" ? "text-danger" : "text-warning";

  return (
    <section>
      <h3 className={`flex items-center gap-2 text-[12px] font-medium ${issues.length === 0 ? "text-muted" : color}`}>
        <Icon className="size-3.5" aria-hidden="true" />
        {title}
      </h3>
      {issues.length === 0 ? (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
          <CheckCircle2 className="size-3 text-success" aria-hidden="true" />
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-1.5 space-y-1.5">
          {issues.map((issue, index) => (
            <li
              key={`${issue.code}-${issue.nodeId ?? ""}-${issue.branchId ?? ""}-${index}`}
              className="flex items-start justify-between gap-3 rounded-[8px] border border-border-subtle bg-background/40 px-3 py-2"
            >
              <span className="text-[12px] leading-relaxed text-secondary">{issue.message}</span>
              {issue.nodeId ? (
                <button
                  type="button"
                  onClick={() => issue.nodeId && onGoToNode(issue.nodeId)}
                  className="shrink-0 text-[11px] font-medium text-accent-soft underline-offset-2 hover:underline"
                >
                  Go to step
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ChecksSummaryBadge({ validation }: { validation: ValidationResult }) {
  if (validation.ok && validation.warnings.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-success">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Ready to publish
      </span>
    );
  }
  if (!validation.ok) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-danger">
        <XCircle className="size-3.5" aria-hidden="true" />
        {pluralise(validation.errors.length, "error")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-warning">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      {pluralise(validation.warnings.length, "warning")}
    </span>
  );
}