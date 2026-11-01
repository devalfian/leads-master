/**
 * Pure rule evaluation.
 *
 * `evaluateRule()` takes a snapshot of stored records and returns the reminders
 * that *should* exist right now. It never writes anything, so the same function
 * powers the dashboard queue (recomputed on every read, always current) and the
 * persisted automation queue (upserted by `automation/repository`).
 *
 * Two safety rules are applied to every rule:
 *  - a do-not-contact lead is never queued for outreach;
 *  - an archived lead is never queued at all.
 */

import { formatMinorUnits } from "@/lib/quotes/money";
import { FOLLOW_UP_TYPE_LABELS, isFollowUpType } from "@/lib/leads/types";
import { addDays, formatPeriodDate, wibDayEndIso } from "@/lib/analytics/period";
import { isActiveLead } from "@/lib/analytics/metrics";
import type { AnalyticsSnapshot, DesiredAlert, LeadSnapshot, NextAction } from "@/lib/analytics/types";
import type { AutomationRuleKey, RuleConfig } from "./types";

export type RuleInput = {
  /**
   * Only the three datasets the rules read. The dashboard passes its full
   * snapshot (structurally compatible); the automation runner loads just these,
   * so an evaluation never pays for the call-event query it does not use.
   */
  snapshot: Pick<AnalyticsSnapshot, "leads" | "followUps" | "quotes">;
  /** Evaluation instant, UTC. */
  now: Date;
  /** WIB calendar day of `now`, `YYYY-MM-DD`. */
  today: string;
  configs: Record<AutomationRuleKey, RuleConfig>;
};

function leadIndex(
  snapshot: Pick<AnalyticsSnapshot, "leads">,
): Map<string, LeadSnapshot> {
  return new Map(snapshot.leads.map((lead) => [lead.id, lead]));
}

/** A lead that may still be worked, and has not asked to be left alone. */
function isWorkable(lead: LeadSnapshot | undefined): lead is LeadSnapshot {
  return Boolean(lead) && lead!.archivedAt === null && !lead!.doNotContact && isActiveLead(lead!);
}

/** A future follow-up means the lead already has a next action. */
function hasFutureFollowUp(lead: LeadSnapshot, nowIso: string): boolean {
  return lead.nextFollowUpAt !== null && lead.nextFollowUpAt >= nowIso;
}

function quoteLabel(quote: { quoteNumber: string; currencyCode: string; currencyLabel: string; totalMinor: number }): string {
  return `${quote.quoteNumber} · ${formatMinorUnits(quote.totalMinor, {
    currencyCode: quote.currencyCode,
    currencyLabel: quote.currencyLabel,
  })}`;
}

/* Rule A ------------------------------------------------------------------- */

function overdueFollowUps({ snapshot, now }: RuleInput): DesiredAlert[] {
  const nowIso = now.toISOString();
  const leads = leadIndex(snapshot);
  const alerts: DesiredAlert[] = [];

  for (const followUp of snapshot.followUps) {
    if (followUp.status !== "scheduled") continue;
    if (followUp.dueAt >= nowIso) continue;

    const lead = leads.get(followUp.leadId);
    if (!isWorkable(lead)) continue;

    const typeLabel = isFollowUpType(followUp.type)
      ? FOLLOW_UP_TYPE_LABELS[followUp.type]
      : "Follow-up";

    alerts.push({
      dedupeKey: `overdue_followups:follow_up:${followUp.id}`,
      ruleKey: "overdue_followups",
      entityType: "follow_up",
      entityId: followUp.id,
      leadId: lead.id,
      leadName: lead.businessName,
      marketName: lead.marketName,
      nicheName: lead.nicheName,
      priority: "high",
      title: "Follow-up overdue",
      message: `${typeLabel} was due ${formatPeriodDate(followUp.dueAt.slice(0, 10))}.`,
      actionLabel: "Complete the follow-up",
      reason:
        "The follow-up is still marked as scheduled and its due time has passed. Completing it records the outcome; nothing is changed automatically.",
      dueAt: followUp.dueAt,
      quoteId: null,
      quoteNumber: null,
      href: `/leads/${lead.id}`,
    });
  }

  return alerts;
}

/* Rule B ------------------------------------------------------------------- */

function quoteExpiring({ snapshot, today, configs }: RuleInput): DesiredAlert[] {
  const windowDays = configs.quote_expiring.windowDays ?? 3;
  const lastDay = addDays(today, windowDays);
  const leads = leadIndex(snapshot);
  const alerts: DesiredAlert[] = [];

  for (const quote of snapshot.quotes) {
    if (quote.status !== "sent") continue;
    if (!quote.validUntil) continue;
    if (quote.validUntil < today || quote.validUntil > lastDay) continue;

    const lead = leads.get(quote.leadId);

    alerts.push({
      dedupeKey: `quote_expiring:quote:${quote.id}:${quote.validUntil}`,
      ruleKey: "quote_expiring",
      entityType: "quote",
      entityId: quote.id,
      leadId: quote.leadId,
      leadName: quote.leadName,
      marketName: quote.marketName ?? lead?.marketName ?? "Unknown",
      nicheName: lead?.nicheName ?? null,
      priority: "high",
      title: "Quotation expires soon",
      message: `${quoteLabel(quote)} for ${quote.leadName} is valid until ${formatPeriodDate(quote.validUntil)}.`,
      actionLabel: "Follow up before it expires",
      reason:
        "The quotation is marked as sent and its recorded valid-until date is inside the reminder window. The validity date is not extended automatically.",
      dueAt: wibDayEndIso(quote.validUntil),
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      href: `/quotes/${quote.id}`,
    });
  }

  return alerts;
}

/* Rule C ------------------------------------------------------------------- */

/**
 * A lead is stale when nothing has happened for longer than the threshold — not
 * merely because the record is old. A lead with a future follow-up already has
 * a next action and is never flagged.
 */
function staleLeads({ snapshot, now, configs }: RuleInput): DesiredAlert[] {
  const staleDays = configs.stale_leads.staleDays ?? 7;
  const nowIso = now.toISOString();
  const threshold = new Date(now.getTime() - staleDays * 86_400_000).toISOString();
  const alerts: DesiredAlert[] = [];

  for (const lead of snapshot.leads) {
    if (!isWorkable(lead)) continue;
    if (hasFutureFollowUp(lead, nowIso)) continue;

    const lastTouch = lead.lastContactAt ?? lead.createdAt;
    if (lastTouch >= threshold) continue;

    const days = Math.floor((now.getTime() - Date.parse(lastTouch)) / 86_400_000);

    alerts.push({
      dedupeKey: `stale_leads:lead:${lead.id}`,
      ruleKey: "stale_leads",
      entityType: "lead",
      entityId: lead.id,
      leadId: lead.id,
      leadName: lead.businessName,
      marketName: lead.marketName,
      nicheName: lead.nicheName,
      priority: "low",
      title: "Lead needs attention",
      message: lead.lastContactAt
        ? `No contact recorded for ${days} days.`
        : `Created ${days} days ago and never contacted.`,
      actionLabel: "Review this lead",
      reason: `No call and no scheduled follow-up in the last ${staleDays} days. The threshold is your own setting, not a benchmark.`,
      dueAt: null,
      quoteId: null,
      quoteNumber: null,
      href: `/leads/${lead.id}`,
    });
  }

  return alerts;
}

/* Rule D ------------------------------------------------------------------- */

/**
 * Interest is taken only from a structured outcome or a stage that already
 * implies it. Free-text notes are never classified.
 */
function interestedWithoutNextAction({ snapshot, now }: RuleInput): DesiredAlert[] {
  const nowIso = now.toISOString();
  const quotesAwaiting = new Set(
    snapshot.quotes.filter((quote) => quote.status === "sent").map((quote) => quote.leadId),
  );
  const alerts: DesiredAlert[] = [];

  for (const lead of snapshot.leads) {
    if (!isWorkable(lead)) continue;
    if (!lead.hasInterest) continue;
    if (hasFutureFollowUp(lead, nowIso)) continue;
    if (quotesAwaiting.has(lead.id)) continue;

    alerts.push({
      dedupeKey: `interested_no_next_action:lead:${lead.id}`,
      ruleKey: "interested_no_next_action",
      entityType: "lead",
      entityId: lead.id,
      leadId: lead.id,
      leadName: lead.businessName,
      marketName: lead.marketName,
      nicheName: lead.nicheName,
      priority: "medium",
      title: "Interested lead has no next action",
      message:
        "A call recorded interest, but nothing is scheduled and no quotation is awaiting a decision.",
      actionLabel: "Schedule the next step",
      reason:
        "The last interest outcome was recorded without a follow-up date. Nothing is scheduled automatically — pick the date yourself.",
      dueAt: null,
      quoteId: null,
      quoteNumber: null,
      href: `/leads/${lead.id}`,
    });
  }

  return alerts;
}

/* Rule E ------------------------------------------------------------------- */

function quotesAwaitingDecision({ snapshot, now, configs }: RuleInput): DesiredAlert[] {
  const pendingDays = configs.quote_awaiting_decision.pendingDays ?? 5;
  const threshold = new Date(now.getTime() - pendingDays * 86_400_000).toISOString();
  const leads = leadIndex(snapshot);
  const alerts: DesiredAlert[] = [];

  for (const quote of snapshot.quotes) {
    if (quote.status !== "sent") continue;

    const lead = leads.get(quote.leadId);
    // Elapsed time is only reported when the sent timestamp actually exists.
    const sentAt = quote.sentAt;
    if (sentAt && sentAt > threshold) continue;

    const elapsedDays = sentAt
      ? Math.floor((now.getTime() - Date.parse(sentAt)) / 86_400_000)
      : null;

    alerts.push({
      dedupeKey: `quote_awaiting_decision:quote:${quote.id}`,
      ruleKey: "quote_awaiting_decision",
      entityType: "quote",
      entityId: quote.id,
      leadId: quote.leadId,
      leadName: quote.leadName,
      marketName: quote.marketName ?? lead?.marketName ?? "Unknown",
      nicheName: lead?.nicheName ?? null,
      priority: "medium",
      title: "Quotation awaiting a decision",
      message: sentAt
        ? `${quoteLabel(quote)} was sent ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago with no recorded outcome.`
        : `${quoteLabel(quote)} is marked as sent but has no sent date recorded.`,
      actionLabel: "Follow up on the quotation",
      reason: sentAt
        ? "No acceptance or rejection has been recorded since it was sent. The quotation is not marked rejected or expired automatically."
        : "Without a sent date the elapsed time cannot be calculated, so only the missing outcome is reported.",
      dueAt: null,
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      href: `/quotes/${quote.id}`,
    });
  }

  return alerts;
}

/* Dispatch ----------------------------------------------------------------- */

const EVALUATORS: Record<AutomationRuleKey, (input: RuleInput) => DesiredAlert[]> = {
  overdue_followups: overdueFollowUps,
  quote_expiring: quoteExpiring,
  stale_leads: staleLeads,
  interested_no_next_action: interestedWithoutNextAction,
  quote_awaiting_decision: quotesAwaitingDecision,
};

export function evaluateRule(key: AutomationRuleKey, input: RuleInput): DesiredAlert[] {
  return EVALUATORS[key](input);
}

/**
 * Evaluates only the enabled rules. Disabled rules contribute nothing, which is
 * what makes the toggle meaningful rather than cosmetic.
 */
export function evaluateAllRules(
  input: RuleInput,
  enabled: Record<AutomationRuleKey, boolean>,
): { alerts: DesiredAlert[]; skipped: AutomationRuleKey[] } {
  const alerts: DesiredAlert[] = [];
  const skipped: AutomationRuleKey[] = [];

  for (const key of Object.keys(EVALUATORS) as AutomationRuleKey[]) {
    if (!enabled[key]) {
      skipped.push(key);
      continue;
    }
    alerts.push(...EVALUATORS[key](input));
  }

  return { alerts, skipped };
}

/* Grouping ----------------------------------------------------------------- */

const PRIORITY_ORDER: Record<DesiredAlert["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Folds alerts about the same lead into one card with a primary action, so a
 * lead with an overdue follow-up and a pending quote does not appear twice.
 *
 * Nothing is discarded: the other facts become `secondary` lines on the card,
 * and every underlying task keeps its own row in the automation queue.
 */
export function buildNextActions(alerts: readonly DesiredAlert[], limit = 12): NextAction[] {
  const byLead = new Map<string, DesiredAlert[]>();
  for (const alert of alerts) {
    const bucket = byLead.get(alert.leadId);
    if (bucket) bucket.push(alert);
    else byLead.set(alert.leadId, [alert]);
  }

  const compare = (left: DesiredAlert, right: DesiredAlert): number => {
    const priority = PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority];
    if (priority !== 0) return priority;
    if (left.dueAt && right.dueAt) return left.dueAt < right.dueAt ? -1 : 1;
    if (left.dueAt) return -1;
    if (right.dueAt) return 1;
    return left.leadName.localeCompare(right.leadName);
  };

  const cards: NextAction[] = [];

  for (const [leadId, group] of byLead) {
    const sorted = [...group].sort(compare);
    const primary = sorted[0];
    if (!primary) continue;

    cards.push({
      ...primary,
      id: `action:${leadId}:${primary.ruleKey}`,
      secondary: sorted.slice(1).map((alert) => alert.message),
    });
  }

  return cards.sort((left, right) => compare(left, right)).slice(0, limit);
}
