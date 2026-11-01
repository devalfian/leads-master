import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES, type LeadStatus } from "@/lib/leads/types";
import { followUpDay, followUpToday } from "@/lib/leads/follow-up-time";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={LEAD_STATUS_TONES[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

/**
 * Due today / overdue are calendar-day comparisons in the reporting zone, using the
 * same rule as Analytics, the automation queue and `getLeadStats()`, so one follow-up
 * can never be "due today" here and "overdue" there.
 */
export function followUpState(dueAt: string | null): "none" | "overdue" | "today" | "upcoming" {
  if (!dueAt) return "none";
  const today = followUpToday();
  const day = followUpDay(dueAt);
  if (day < today) return "overdue";
  if (day === today) return "today";
  return "upcoming";
}

export function FollowUpLabel({ dueAt }: { dueAt: string | null }) {
  const state = followUpState(dueAt);
  if (state === "none" || !dueAt) return <span className="text-muted">Not scheduled</span>;
  return (
    <span
      className={
        state === "overdue" ? "text-danger" : state === "today" ? "text-warning" : "text-secondary"
      }
    >
      {dueAt.slice(0, 10)}
      {state === "overdue" ? " · overdue" : state === "today" ? " · due today" : ""}
    </span>
  );
}