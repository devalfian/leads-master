"use client";

import Link from "next/link";
import { Archive, Copy, Eye, FileEdit, Phone, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CallbookStatusBadge, UnpublishedChangesBadge } from "@/components/callbooks/status-badges";
import { CALLBOOK_GOAL_LABELS, type CallbookSummary } from "@/lib/callbooks/types";
import { formatRelative, pluralise } from "@/lib/utils";

export type CallbookRowProps = {
  callbook: CallbookSummary;
  busyAction: string | null;
  onStartCall: () => void;
  onDuplicate: () => void;
  onArchiveToggle: () => void;
};

function availability(callbook: CallbookSummary) {
  const archived = callbook.status === "archived";
  const canStart = callbook.hasPublishedSnapshot && !archived;
  const startReason = archived
    ? "Archived Callbooks cannot start new calls. Restore it first."
    : "Publish this Callbook before starting a call.";
  return { canStart, startReason };
}

function Details({ callbook }: { callbook: CallbookSummary }) {
  const context = [callbook.marketName, callbook.nicheName]
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/callbooks/${callbook.id}`}
          className="truncate text-[14px] font-medium text-foreground hover:text-accent-soft"
        >
          {callbook.title}
        </Link>
        {callbook.hasUnpublishedChanges ? <UnpublishedChangesBadge /> : null}
      </div>
      <p className="mt-0.5 truncate text-[12px] text-muted">
        {context ? <span className="text-secondary">{context} · </span> : null}
        {callbook.targetAudience || "No target audience set"}
      </p>
    </div>
  );
}

function ActionIcons({
  callbook,
  busyAction,
  onDuplicate,
  onArchiveToggle,
}: Pick<CallbookRowProps, "callbook" | "busyAction" | "onDuplicate" | "onArchiveToggle">) {
  const archived = callbook.status === "archived";
  return (
    <>
      <Button asChild variant="ghost" size="icon" title="Preview this conversation">
        <Link
          href={`/callbooks/${callbook.id}/preview`}
          aria-label={`Preview ${callbook.title}`}
        >
          <Eye aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" title="Open the builder">
        <Link href={`/callbooks/${callbook.id}`} aria-label={`Open builder for ${callbook.title}`}>
          <FileEdit aria-hidden="true" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Duplicate this Callbook"
        aria-label={`Duplicate ${callbook.title}`}
        loading={busyAction === "duplicate"}
        onClick={onDuplicate}
      >
        {busyAction === "duplicate" ? null : <Copy aria-hidden="true" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title={archived ? "Restore this Callbook" : "Archive this Callbook"}
        aria-label={archived ? `Restore ${callbook.title}` : `Archive ${callbook.title}`}
        loading={busyAction === "archive" || busyAction === "restore"}
        onClick={onArchiveToggle}
      >
        {busyAction === "archive" || busyAction === "restore" ? null : archived ? (
          <RotateCcw aria-hidden="true" />
        ) : (
          <Archive aria-hidden="true" />
        )}
      </Button>
    </>
  );
}

export function CallbookRow(props: CallbookRowProps) {
  const { callbook } = props;
  const { canStart, startReason } = availability(callbook);

  return (
    <tr className="border-b border-border-subtle/70 transition-colors last:border-b-0 hover:bg-surface-elevated/40">
      <td className="px-5 py-3.5">
        <Details callbook={callbook} />
      </td>
      <td className="px-3 py-3.5 text-[13px] text-secondary">
        {CALLBOOK_GOAL_LABELS[callbook.primaryGoal]}
      </td>
      <td className="px-3 py-3.5 text-[13px] text-secondary">
        {pluralise(callbook.nodeCount, "step")}
        <span className="text-muted"> · </span>
        {pluralise(callbook.branchCount, "response")}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex flex-col items-start gap-1">
          <CallbookStatusBadge status={callbook.status} />
          {callbook.completedSessionCount > 0 ? (
            <span className="text-[11px] text-muted">
              {pluralise(callbook.completedSessionCount, "call")} logged
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3.5 text-[13px] text-secondary">
        {formatRelative(callbook.updatedAt)}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="primary"
            size="sm"
            disabled={!canStart}
            title={canStart ? "Start a call" : startReason}
            onClick={props.onStartCall}
          >
            <Phone aria-hidden="true" />
            Start call
          </Button>
          <ActionIcons
            callbook={callbook}
            busyAction={props.busyAction}
            onDuplicate={props.onDuplicate}
            onArchiveToggle={props.onArchiveToggle}
          />
        </div>
      </td>
    </tr>
  );
}

export function CallbookCard(props: CallbookRowProps) {
  const { callbook } = props;
  const { canStart, startReason } = availability(callbook);

  return (
    <div className="rounded-card border border-border-subtle bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <Details callbook={callbook} />
        <CallbookStatusBadge status={callbook.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <Badge tone="neutral">{CALLBOOK_GOAL_LABELS[callbook.primaryGoal]}</Badge>
        <span>{pluralise(callbook.nodeCount, "step")}</span>
        <span>·</span>
        <span>{pluralise(callbook.branchCount, "response")}</span>
        <span>·</span>
        <span>Updated {formatRelative(callbook.updatedAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={!canStart}
          title={canStart ? "Start a call" : startReason}
          onClick={props.onStartCall}
        >
          <Phone aria-hidden="true" />
          Start call
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/callbooks/${callbook.id}`}>Open</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/callbooks/${callbook.id}/preview`}>Preview</Link>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={props.busyAction === "duplicate"}
          onClick={props.onDuplicate}
        >
          Duplicate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={props.busyAction === "archive" || props.busyAction === "restore"}
          onClick={props.onArchiveToggle}
        >
          {callbook.status === "archived" ? "Restore" : "Archive"}
        </Button>
      </div>
    </div>
  );
}