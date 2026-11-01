/**
 * Metric definitions.
 *
 * Every figure the dashboard shows is produced by one of the functions below,
 * and each one documents exactly what it counts. The sets are explicit because
 * the distinction they make is the difference between an honest number and a
 * flattering one:
 *
 * - A call with no answer is an attempt, not a conversation.
 * - A conversation is only counted from a structured outcome, never from a note.
 * - "Interested" means a specific outcome, not a keyword in free text.
 * - A rate with an empty denominator is `null` (rendered "N/A"), never 0%.
 *
 * All functions here are pure: no database, no clock, no environment.
 */

import { OUTCOMES, type OutcomeTone } from "@/lib/callbooks/outcomes";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/types";
import { eachDay, toWibDate, type AnalyticsPeriod } from "./period";
import type {
  CallEvent,
  CurrencyAmount,
  FunnelStage,
  LeadSnapshot,
  OutcomeSlice,
  QuoteSnapshot,
  Rate,
  TrendPoint,
} from "./types";

/**
 * Outcomes that can only be recorded if a human actually spoke: the prospect
 * declined, showed interest, asked to be contacted later, booked a meeting, or
 * was disqualified during the conversation.
 *
 * Deliberately excluded:
 * - `no_answer` / `wrong_number` — nobody relevant was reached.
 * - `other` — ambiguous; the notes explain it, and notes are not a classifier.
 */
export const CONVERSATION_OUTCOMES = [
  "meeting_booked",
  "follow_up_later",
  "interested_no_meeting",
  "not_interested",
  "disqualified",
] as const;

/**
 * Outcomes that record explicit interest. `follow_up_later` is excluded: it
 * records permission to call again, not interest in the offer.
 */
export const INTERESTED_OUTCOMES = ["meeting_booked", "interested_no_meeting"] as const;

const CONVERSATION_SET: ReadonlySet<string> = new Set(CONVERSATION_OUTCOMES);
const INTERESTED_SET: ReadonlySet<string> = new Set(INTERESTED_OUTCOMES);

/** Lead statuses that still represent live work. */
export const ACTIVE_LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "researching",
  "ready_to_contact",
  "contacted",
  "interested",
  "follow_up_required",
  "qualified",
  "proposal",
];

/** Lead statuses that end the pipeline: never flagged as needing attention. */
export const CLOSED_LEAD_STATUSES: readonly LeadStatus[] = ["won", "lost", "not_a_fit"];

const ACTIVE_STATUS_SET: ReadonlySet<string> = new Set(ACTIVE_LEAD_STATUSES);
const CLOSED_STATUS_SET: ReadonlySet<string> = new Set(CLOSED_LEAD_STATUSES);

export function isConversationOutcome(key: string | null): boolean {
  return key !== null && CONVERSATION_SET.has(key);
}

export function isInterestedOutcome(key: string | null): boolean {
  return key !== null && INTERESTED_SET.has(key);
}

export function isActiveLead(lead: LeadSnapshot): boolean {
  return lead.archivedAt === null && ACTIVE_STATUS_SET.has(lead.status);
}

export function isClosedLead(lead: LeadSnapshot): boolean {
  return CLOSED_STATUS_SET.has(lead.status);
}

/* Counts ------------------------------------------------------------------- */

export function countCalls(events: readonly CallEvent[]): number {
  return events.length;
}

/** Distinct leads with at least one call, using the stored lead id. */
export function countUniqueLeads(events: readonly CallEvent[]): number {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.leadId) ids.add(event.leadId);
  }
  return ids.size;
}

export function countConversations(events: readonly CallEvent[]): number {
  return events.filter((event) => isConversationOutcome(event.outcomeKey)).length;
}

/** Distinct leads that produced at least one interest outcome. */
export function countInterestedLeads(events: readonly CallEvent[]): number {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.leadId && isInterestedOutcome(event.outcomeKey)) ids.add(event.leadId);
  }
  return ids.size;
}

/** One slice per known outcome plus a slice for calls with no outcome at all. */
export function outcomeHistogram(events: readonly CallEvent[]): OutcomeSlice[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = event.outcomeKey ?? "unrecorded";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const slices: OutcomeSlice[] = OUTCOMES.map((definition) => ({
    key: definition.key,
    label: definition.label,
    tone: definition.tone,
    count: counts.get(definition.key) ?? 0,
  }));

  const unrecorded = counts.get("unrecorded") ?? 0;
  if (unrecorded > 0) {
    slices.push({
      key: "unrecorded",
      label: "Not recorded",
      tone: "neutral" as OutcomeTone,
      count: unrecorded,
    });
  }

  return slices.filter((slice) => slice.count > 0);
}

/** Calls and conversations per WIB calendar day, including empty days. */
export function dailyTrend(events: readonly CallEvent[], period: AnalyticsPeriod): TrendPoint[] {
  const calls = new Map<string, number>();
  const conversations = new Map<string, number>();

  for (const event of events) {
    const day = toWibDate(event.at);
    calls.set(day, (calls.get(day) ?? 0) + 1);
    if (isConversationOutcome(event.outcomeKey)) {
      conversations.set(day, (conversations.get(day) ?? 0) + 1);
    }
  }

  return eachDay(period).map((date) => ({
    date,
    calls: calls.get(date) ?? 0,
    conversations: conversations.get(date) ?? 0,
  }));
}

/**
 * `null` when there is nothing to divide by. Rendering 0% for "no data yet"
 * would be a fabricated result, so callers must show N/A instead.
 */
export function rate(numerator: number, denominator: number): Rate {
  if (denominator <= 0) return { value: null, numerator, denominator };
  return { value: (numerator / denominator) * 100, numerator, denominator };
}

/**
 * Acceptance rate over quotes with a recorded final outcome.
 *
 * Denominator = accepted + rejected. Drafts, sent-but-undecided and cancelled
 * quotes are excluded, because they have no outcome to divide by.
 */
export function quoteAcceptance(quotes: readonly QuoteSnapshot[]): Rate {
  const accepted = quotes.filter((quote) => quote.status === "accepted").length;
  const rejected = quotes.filter((quote) => quote.status === "rejected").length;
  return rate(accepted, accepted + rejected);
}

/* Money -------------------------------------------------------------------- */

/**
 * Groups amounts by currency. Currencies are never added together: there is no
 * exchange rate anywhere in this application, so a cross-currency total would be
 * a number that means nothing.
 */
export function groupByCurrency(
  rows: ReadonlyArray<{ currencyCode: string; currencyLabel: string; totalMinor: number }>,
): CurrencyAmount[] {
  const byCode = new Map<string, CurrencyAmount>();
  for (const row of rows) {
    const existing = byCode.get(row.currencyCode);
    if (existing) {
      existing.amountMinor += row.totalMinor;
      existing.count += 1;
      continue;
    }
    byCode.set(row.currencyCode, {
      currencyCode: row.currencyCode,
      currencyLabel: row.currencyLabel,
      amountMinor: row.totalMinor,
      count: 1,
    });
  }
  return [...byCode.values()].sort((left, right) =>
    left.currencyCode.localeCompare(right.currencyCode),
  );
}

/* Funnel ------------------------------------------------------------------- */

/**
 * Cohort funnel: the population is the leads **created within the reporting
 * period**, and each stage is measured from the evidence that exists for those
 * leads today.
 *
 * This is the only defensible funnel with the data available: the application
 * stores current lead statuses and call events, not a stage-transition log, so a
 * historical "conversion" claim would be invented. The stages are therefore
 * labelled as a cohort, and the pipeline block separately shows the current
 * snapshot.
 */
export function buildCohortFunnel({
  cohortLeads,
  quotes,
}: {
  cohortLeads: readonly LeadSnapshot[];
  quotes: readonly QuoteSnapshot[];
}): FunnelStage[] {
  const cohortIds = new Set(cohortLeads.map((lead) => lead.id));
  const cohortQuotes = quotes.filter((quote) => cohortIds.has(quote.leadId));
  const quotedLeadIds = new Set(cohortQuotes.map((quote) => quote.leadId));
  const acceptedLeadIds = new Set(
    cohortQuotes.filter((quote) => quote.status === "accepted").map((quote) => quote.leadId),
  );

  const identified = cohortLeads.length;
  const contacted = cohortLeads.filter((lead) => lead.callCount + lead.sessionCount > 0).length;
  const conversation = cohortLeads.filter((lead) => lead.hasConversation).length;
  const interested = cohortLeads.filter(
    (lead) =>
      lead.hasInterest ||
      lead.status === "interested" ||
      lead.status === "qualified" ||
      lead.status === "proposal" ||
      lead.status === "won",
  ).length;

  const stages: Array<{ key: string; label: string; count: number; note: string | null }> = [
    {
      key: "identified",
      label: "Prospects identified",
      count: identified,
      note: "Leads created in the selected period.",
    },
    {
      key: "contacted",
      label: "Contact attempted",
      count: contacted,
      note: "At least one call recorded, ever.",
    },
    {
      key: "conversation",
      label: "Conversation established",
      count: conversation,
      note: "A call outcome that requires someone to have spoken.",
    },
    {
      key: "interested",
      label: "Interested",
      count: interested,
      note: "An interest outcome, or the lead's current stage moved past contact.",
    },
    {
      key: "quoted",
      label: "Quotation raised",
      count: quotedLeadIds.size,
      note: "At least one quotation exists for the lead.",
    },
    {
      key: "accepted",
      label: "Quotation accepted",
      count: acceptedLeadIds.size,
      note: "A quotation was recorded as accepted. Not a payment.",
    },
  ];

  return stages.map((stage, index) => ({
    ...stage,
    conversion: index === 0 ? null : rate(stage.count, stages[index - 1]?.count ?? 0).value,
  }));
}

/* Stage distribution ------------------------------------------------------- */

/** Current pipeline snapshot — not a conversion funnel. */
export function stageDistribution(
  leads: readonly LeadSnapshot[],
): Array<{ status: LeadStatus; count: number }> {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    if (lead.archivedAt !== null) continue;
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }
  return LEAD_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
}
