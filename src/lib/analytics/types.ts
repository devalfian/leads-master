/**
 * Shapes shared by the analytics data layer, the pure metric functions and the
 * dashboard UI.
 *
 * Every value here is derived from stored records. Nothing in this file is a
 * constant business figure: there are no targets, benchmarks, conversion rates
 * or revenue numbers, because this application stores none.
 */

import type { LeadStatus } from "@/lib/leads/types";
import type { OutcomeTone } from "@/lib/callbooks/outcomes";
import type { AnalyticsPeriod } from "./period";

/** One call event, whichever table it came from. */
export type CallEvent = {
  /** UTC ISO timestamp of the call itself (`called_at` / `started_at`). */
  at: string;
  /** `null` when the call has no recorded outcome. */
  outcomeKey: string | null;
  /** `null` for a Callbook run that was never attached to a lead. */
  leadId: string | null;
  marketCode: string | null;
  marketName: string | null;
  nicheName: string | null;
};

/** A lead with the aggregates the queue and the funnel need. */
export type LeadSnapshot = {
  id: string;
  businessName: string;
  marketId: string;
  marketCode: string;
  marketName: string;
  nicheCategoryId: string | null;
  nicheName: string | null;
  city: string | null;
  status: LeadStatus;
  doNotContact: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  callCount: number;
  sessionCount: number;
  /** Latest of any recorded call, or `null` when never contacted. */
  lastContactAt: string | null;
  /** Earliest scheduled follow-up, or `null`. */
  nextFollowUpAt: string | null;
  lastOutcomeKey: string | null;
  /** Any recorded call ever carried an interest outcome. */
  hasInterest: boolean;
  /** Any recorded call ever established a conversation. */
  hasConversation: boolean;
};

export type FollowUpSnapshot = {
  id: string;
  leadId: string;
  leadName: string;
  marketCode: string;
  marketName: string;
  nicheName: string | null;
  dueAt: string;
  type: string;
  notes: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
};

export type QuoteSnapshot = {
  id: string;
  quoteNumber: string;
  leadId: string;
  leadName: string;
  marketCode: string | null;
  marketName: string | null;
  status: "draft" | "sent" | "accepted" | "rejected" | "cancelled";
  currencyCode: string;
  currencyLabel: string;
  totalMinor: number;
  projectTitle: string;
  createdAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  validUntil: string | null;
};

/** The three datasets every metric and rule is computed from. */
export type AnalyticsSnapshot = {
  /** Call events inside the reporting period only. */
  events: CallEvent[];
  /** Call events inside the comparison period only. */
  previousEvents: CallEvent[];
  leads: LeadSnapshot[];
  followUps: FollowUpSnapshot[];
  quotes: QuoteSnapshot[];
  /** True when the event query hit its safety cap and the figures are partial. */
  eventsTruncated: boolean;
};

export type CurrencyAmount = {
  currencyCode: string;
  currencyLabel: string;
  amountMinor: number;
  count: number;
};

export type Rate = {
  /** `null` when the denominator is zero — never rendered as 0%. */
  value: number | null;
  numerator: number;
  denominator: number;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  /** `count / previous.count`, or `null` when the previous stage is empty. */
  conversion: number | null;
  note: string | null;
};

export type TrendPoint = {
  date: string;
  calls: number;
  conversations: number;
};

export type OutcomeSlice = {
  key: string;
  label: string;
  tone: OutcomeTone;
  count: number;
};

export type MarketBreakdown = {
  marketCode: string;
  marketName: string;
  calls: number;
  conversations: number;
  interestedLeads: number;
  quotesCreated: number;
  quotesAccepted: number;
  acceptance: Rate;
  outstanding: CurrencyAmount[];
};

export type NicheBreakdown = {
  nicheName: string;
  calls: number;
  conversations: number;
  interestedLeads: number;
};

export type ActionPriority = "high" | "medium" | "low";

/**
 * A reminder produced by a deterministic rule.
 *
 * The same object powers two things, so they can never disagree: the
 * dashboard's Next Actions queue (computed on read, never stored) and the
 * persisted automation queue (deduplicated by `dedupeKey`).
 */
export type DesiredAlert = {
  dedupeKey: string;
  ruleKey: string;
  entityType: "follow_up" | "quote" | "lead";
  entityId: string;
  leadId: string;
  leadName: string;
  marketName: string;
  nicheName: string | null;
  priority: ActionPriority;
  title: string;
  /** The fact that triggered the rule. Never a prediction. */
  message: string;
  actionLabel: string;
  reason: string;
  dueAt: string | null;
  quoteId: string | null;
  quoteNumber: string | null;
  href: string;
};

export type NextAction = DesiredAlert & {
  id: string;
  /** Other facts about the same lead, folded into this one card. */
  secondary: string[];
};


export type AnalyticsDashboard = {
  period: AnalyticsPeriod;
  comparison: AnalyticsPeriod;
  filters: {
    marketCode: string | null;
    nicheCategoryId: string | null;
  };
  activity: {
    callsMade: number;
    uniqueLeadsContacted: number;
    conversations: number;
    interestedLeads: number;
    followUpsDue: number;
    followUpsOverdue: number;
    previous: {
      callsMade: number;
      uniqueLeadsContacted: number;
      conversations: number;
      interestedLeads: number;
    };
  };
  pipeline: {
    activeLeads: number;
    byStage: Array<{ status: LeadStatus; count: number }>;
    quotesAwaitingDecision: number;
    expiringQuotes: number;
    leadsRequiringAttention: number;
  };
  quotes: {
    created: number;
    sent: number;
    accepted: number;
    rejected: number;
    acceptance: Rate;
    outstanding: CurrencyAmount[];
    acceptedValue: CurrencyAmount[];
  };
  funnel: FunnelStage[];
  funnelCohortSize: number;
  trend: TrendPoint[];
  outcomes: OutcomeSlice[];
  byMarket: MarketBreakdown[];
  byNiche: NicheBreakdown[];
  actions: NextAction[];
  /** Honest statements about what the data cannot establish. */
  dataNotes: string[];
};
