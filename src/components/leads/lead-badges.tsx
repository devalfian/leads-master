import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES, type LeadStatus } from "@/lib/leads/types";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={LEAD_STATUS_TONES[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

/** Due today / overdue are date-part comparisons of the stored follow-up value. */
export function followUpState(dueAt: string | null): "none" | "overdue" | "today" | "upcoming" {
  if (!dueAt) return "none";
  const today = new Date().toISOString().slice(0, 10);
  const day = dueAt.slice(0, 10);
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