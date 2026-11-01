/**
 * Lead, logged-call and follow-up domain types.
 *
 * These are new in Phase 3 and deliberately separate from the Callbook model:
 * a lead is a business, a call is an event, and a follow-up is a task. The
 * existing `call_sessions` history is reused for Callbook runs; manual logs live
 * in `lead_calls`. Both are read through one Call History query.
 */

export const LEAD_STATUSES = [
  "new",
  "researching",
  "ready_to_contact",
  "contacted",
  "interested",
  "follow_up_required",
  "qualified",
  "proposal",
  "won",
  "lost",
  "not_a_fit",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  researching: "Researching",
  ready_to_contact: "Ready to contact",
  contacted: "Contacted",
  interested: "Interested",
  follow_up_required: "Follow-up required",
  qualified: "Qualified",
  proposal: "Proposal / quote",
  won: "Won",
  lost: "Lost",
  not_a_fit: "Not a fit",
};

export const LEAD_STATUS_TONES: Record<
  LeadStatus,
  "neutral" | "accent" | "success" | "warning" | "danger" | "info"
> = {
  new: "neutral",
  researching: "neutral",
  ready_to_contact: "info",
  contacted: "info",
  interested: "accent",
  follow_up_required: "warning",
  qualified: "accent",
  proposal: "warning",
  won: "success",
  lost: "danger",
  not_a_fit: "neutral",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

export const FOLLOW_UP_TYPES = [
  "call_back",
  "review_demo",
  "send_info",
  "quote_follow_up",
  "meeting",
  "other",
] as const;

export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  call_back: "Call back",
  review_demo: "Review demo",
  send_info: "Send requested information",
  quote_follow_up: "Follow up on quote",
  meeting: "Meeting",
  other: "Other",
};

export function isFollowUpType(value: unknown): value is FollowUpType {
  return typeof value === "string" && (FOLLOW_UP_TYPES as readonly string[]).includes(value);
}

export const FOLLOW_UP_STATUSES = ["scheduled", "completed", "cancelled"] as const;

export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function isFollowUpStatus(value: unknown): value is FollowUpStatus {
  return typeof value === "string" && (FOLLOW_UP_STATUSES as readonly string[]).includes(value);
}

export type Lead = {
  id: string;
  businessName: string;
  contactName: string | null;
  contactRole: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  marketId: string;
  marketCode: string;
  marketName: string;
  currencyCode: string;
  currencyLabel: string;
  nicheCategoryId: string | null;
  nicheName: string | null;
  city: string | null;
  address: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string;
  estimatedValueAmount: number | null;
  doNotContact: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** List projection: the lead plus the counters the list and detail need. */
export type LeadWithActivity = Lead & {
  callCount: number;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  openFollowUpCount: number;
};

export type LeadCall = {
  id: string;
  leadId: string;
  callbookId: string | null;
  callbookTitle: string | null;
  packageId: string | null;
  packageName: string | null;
  calledAt: string;
  outcomeKey: string;
  notes: string;
  nextAction: string | null;
  followUpAt: string | null;
  createdAt: string;
};

export type FollowUp = {
  id: string;
  leadId: string;
  leadCallId: string | null;
  callSessionId: string | null;
  dueAt: string;
  type: FollowUpType;
  notes: string;
  status: FollowUpStatus;
  completedAt: string | null;
  createdAt: string;
};

/** A step in the lead activity timeline, built only from real records. */
export type LeadTimelineEntry = {
  id: string;
  kind: "call" | "callbook_run" | "follow_up" | "lead_created" | "lead_updated" | "quote";
  at: string;
  title: string;
  detail: string | null;
  outcomeKey?: string | null;
  href?: string | null;
};

export type LeadDetail = LeadWithActivity & {
  calls: LeadCall[];
  callSessions: Array<{
    id: string;
    callbookTitle: string;
    status: string;
    outcomeKey: string | null;
    startedAt: string;
    endedAt: string | null;
    notes: string;
    nextAction: string | null;
    followUpAt: string | null;
    stepCount: number;
  }>;
  followUps: FollowUp[];
  timeline: LeadTimelineEntry[];
};