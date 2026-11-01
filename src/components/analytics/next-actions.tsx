import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { NextAction } from "@/lib/analytics/types";

const PRIORITY_TONE = {
  high: "danger",
  medium: "warning",
  low: "neutral",
} as const;

const PRIORITY_LABEL = {
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

/**
 * The prioritized work queue.
 *
 * Each card states what happened, why it is being raised, and where to act. The
 * button opens the existing record (lead or quotation) — there is no "call now"
 * action because this application does not place calls.
 */
export function NextActions({ actions }: { actions: NextAction[] }) {
  if (actions.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border-subtle bg-background/40 px-4 py-8 text-center">
        <CheckCircle2 className="mx-auto size-5 text-success" aria-hidden="true" />
        <p className="mt-2 text-[13px] font-medium text-foreground">Nothing needs attention</p>
        <p className="mt-1 text-[12px] leading-relaxed text-secondary">
          No overdue follow-ups, expiring quotations or stale leads match the current rules and
          filters.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {actions.map((action) => {
        const isQuote = action.entityType === "quote" && action.quoteId;
        const Icon = isQuote ? FileText : action.entityType === "follow_up" ? CalendarClock : Users;

        return (
          <li
            key={action.id}
            className="rounded-card border border-border-subtle bg-surface p-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={PRIORITY_TONE[action.priority]}>
                    {PRIORITY_LABEL[action.priority]} priority
                  </Badge>
                  <span className="text-[12.5px] font-semibold text-foreground">
                    {action.leadName}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  {action.marketName}
                  {action.nicheName ? ` · ${action.nicheName}` : ""}
                  {action.dueAt ? ` · due ${formatDateTime(action.dueAt)}` : ""}
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link href={action.href}>
                  <Icon aria-hidden="true" />
                  {isQuote ? "Open quotation" : "Open lead"}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <p className="mt-2 text-[13px] font-medium text-foreground">{action.actionLabel}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-secondary">{action.message}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{action.reason}</p>

            {action.secondary.length > 0 ? (
              <ul className="mt-2 space-y-0.5 border-t border-border-subtle pt-2 text-[11.5px] text-muted">
                {action.secondary.map((line) => (
                  <li key={line}>Also: {line}</li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}