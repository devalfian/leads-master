/**
 * Dashboard assembly.
 *
 * One function turns a stored-data snapshot into the numbers the page renders.
 * Keeping it here — rather than inside the page — means the same figures can be
 * asserted in a test without rendering React, and it keeps every definition in
 * one auditable place.
 *
 * Nothing here reads the clock except `now`, which is passed in.
 */

import { normaliseConfig, type AutomationRuleKey, type RuleConfig } from "@/lib/automation/types";
import { buildNextActions, evaluateAllRules } from "@/lib/automation/rules";
import {
  ACTIVE_LEAD_STATUSES,
  buildCohortFunnel,
  countCalls,
  countConversations,
  countInterestedLeads,
  countUniqueLeads,
  dailyTrend,
  groupByCurrency,
  isActiveLead,
  outcomeHistogram,
  quoteAcceptance,
  stageDistribution,
} from "./metrics";
import { addDays, previousPeriod, type AnalyticsPeriod } from "./period";
import type {
  AnalyticsDashboard,
  AnalyticsSnapshot,
  MarketBreakdown,
  NicheBreakdown,
  QuoteSnapshot,
} from "./types";

function inWindow(value: string | null, period: AnalyticsPeriod): boolean {
  return value !== null && value >= period.startIso && value < period.endIso;
}

/** Quotes with a final outcome recorded inside the window. */
function decidedInPeriod(
  quotes: readonly QuoteSnapshot[],
  period: AnalyticsPeriod,
): QuoteSnapshot[] {
  return quotes.filter(
    (quote) =>
      (quote.status === "accepted" && inWindow(quote.acceptedAt, period)) ||
      (quote.status === "rejected" && inWindow(quote.rejectedAt, period)),
  );
}

function outstandingOf(quotes: readonly QuoteSnapshot[]) {
  return groupByCurrency(
    quotes
      .filter((quote) => quote.status === "sent")
      .map((quote) => ({
        currencyCode: quote.currencyCode,
        currencyLabel: quote.currencyLabel,
        totalMinor: quote.totalMinor,
      })),
  );
}


export function buildAnalyticsDashboard({
  snapshot,
  period,
  comparison = previousPeriod(period),
  filters,
  now = new Date(),
  configs,
  enabled,
}: {
  snapshot: AnalyticsSnapshot;
  period: AnalyticsPeriod;
  comparison?: AnalyticsPeriod;
  filters: { marketCode: string | null; nicheCategoryId: string | null };
  now?: Date;
  configs: Record<AutomationRuleKey, RuleConfig>;
  enabled: Record<AutomationRuleKey, boolean>;
}): AnalyticsDashboard {
  const { events, previousEvents, leads, followUps, quotes } = snapshot;
  const nowIso = now.toISOString();
  const today = now.toISOString().slice(0, 10);

  /* Activity -------------------------------------------------------------- */

  const callsMade = countCalls(events);
  const uniqueLeadsContacted = countUniqueLeads(events);
  const conversations = countConversations(events);
  const interestedLeads = countInterestedLeads(events);

  // "Due" is period-scoped (the workload scheduled in this window); "overdue"
  // is current state, because that is what the user has to act on right now.
  const followUpsDue = followUps.filter(
    (followUp) =>
      followUp.status === "scheduled" &&
      followUp.dueAt >= period.startIso &&
      followUp.dueAt < period.endIso,
  ).length;

  const followUpsOverdue = followUps.filter(
    (followUp) => followUp.status === "scheduled" && followUp.dueAt < nowIso,
  ).length;

  /* Pipeline -------------------------------------------------------------- */

  const activeLeads = leads.filter((lead) => isActiveLead(lead)).length;
  const quotesAwaitingDecision = quotes.filter((quote) => quote.status === "sent").length;

  const expiringWindow = configs.quote_expiring.windowDays ?? 3;
  const expiringLimit = addDays(today, expiringWindow);
  const expiringQuotes = quotes.filter(
    (quote) =>
      quote.status === "sent" &&
      quote.validUntil !== null &&
      quote.validUntil >= today &&
      quote.validUntil <= expiringLimit,
  ).length;

  /* Quotations ------------------------------------------------------------ */

  const createdInPeriod = quotes.filter((quote) => inWindow(quote.createdAt, period));
  const sentInPeriod = quotes.filter((quote) => inWindow(quote.sentAt, period));
  const acceptedInPeriod = quotes.filter(
    (quote) => quote.status === "accepted" && inWindow(quote.acceptedAt, period),
  );
  const rejectedInPeriod = quotes.filter(
    (quote) => quote.status === "rejected" && inWindow(quote.rejectedAt, period),
  );

  const outstanding = outstandingOf(quotes);
  const acceptedValue = groupByCurrency(
    acceptedInPeriod.map((quote) => ({
      currencyCode: quote.currencyCode,
      currencyLabel: quote.currencyLabel,
      totalMinor: quote.totalMinor,
    })),
  );

  /* Funnel ---------------------------------------------------------------- */

  const cohortLeads = leads.filter((lead) => inWindow(lead.createdAt, period));

  /* Breakdowns ------------------------------------------------------------ */

  const marketNames = new Map<string, string>();
  for (const event of events) {
    if (event.marketCode) marketNames.set(event.marketCode, event.marketName ?? event.marketCode);
  }
  for (const lead of leads) marketNames.set(lead.marketCode, lead.marketName);

  const byMarket: MarketBreakdown[] = [...marketNames.entries()]
    .map(([marketCode, marketName]) => {
      const marketEvents = events.filter((event) => event.marketCode === marketCode);
      const marketQuotes = quotes.filter((quote) => quote.marketCode === marketCode);

      return {
        marketCode,
        marketName,
        calls: marketEvents.length,
        conversations: countConversations(marketEvents),
        interestedLeads: countInterestedLeads(marketEvents),
        quotesCreated: marketQuotes.filter((quote) => inWindow(quote.createdAt, period)).length,
        quotesAccepted: marketQuotes.filter(
          (quote) => quote.status === "accepted" && inWindow(quote.acceptedAt, period),
        ).length,
        acceptance: quoteAcceptance(decidedInPeriod(marketQuotes, period)),
        outstanding: outstandingOf(marketQuotes),
      };
    })
    .sort(
      (left, right) =>
        right.calls - left.calls || left.marketName.localeCompare(right.marketName),
    );

  const nicheNames = new Set<string>();
  for (const event of events) {
    if (event.nicheName) nicheNames.add(event.nicheName);
  }

  const byNiche: NicheBreakdown[] = [...nicheNames]
    .map((nicheName) => {
      const nicheEvents = events.filter((event) => event.nicheName === nicheName);
      return {
        nicheName,
        calls: nicheEvents.length,
        conversations: countConversations(nicheEvents),
        interestedLeads: countInterestedLeads(nicheEvents),
      };
    })
    .sort((left, right) => right.calls - left.calls || left.nicheName.localeCompare(right.nicheName));

  /* Actions --------------------------------------------------------------- */

  const { alerts } = evaluateAllRules({ snapshot, now, today, configs }, enabled);
  const actions = buildNextActions(alerts);

  const leadsRequiringAttention = new Set(
    alerts
      .filter(
        (alert) =>
          alert.ruleKey === "stale_leads" || alert.ruleKey === "interested_no_next_action",
      )
      .map((alert) => alert.leadId),
  ).size;

  /* Honest notes about what the data cannot establish --------------------- */

  const dataNotes: string[] = [];

  if (snapshot.eventsTruncated) {
    dataNotes.push(
      "This period contains more call records than the safety cap, so the activity figures are based on a capped subset. Narrow the date range for exact totals.",
    );
  }

  if (events.length === 0) {
    dataNotes.push(
      "No calls were recorded in this period, so the activity trend and outcome distribution are empty.",
    );
  }

  const unrecorded = events.filter((event) => event.outcomeKey === null).length;
  if (unrecorded > 0) {
    dataNotes.push(
      `${unrecorded} call${unrecorded === 1 ? "" : "s"} in this period have no recorded outcome. They count as attempts, never as conversations.`,
    );
  }

  const acceptance = quoteAcceptance(decidedInPeriod(quotes, period));
  if (acceptance.denominator === 0) {
    dataNotes.push(
      "No quotation has a recorded acceptance or rejection in this period, so the acceptance rate is N/A rather than 0%.",
    );
  }

  if (cohortLeads.length === 0) {
    dataNotes.push(
      "No leads were created in this period, so the cohort funnel has no population to measure.",
    );
  }

  const sentWithoutDate = quotes.filter(
    (quote) => quote.status === "sent" && quote.sentAt === null,
  ).length;
  if (sentWithoutDate > 0) {
    dataNotes.push(
      `${sentWithoutDate} sent quotation${sentWithoutDate === 1 ? "" : "s"} have no recorded sent date, so their elapsed time is not reported.`,
    );
  }

  dataNotes.push(
    "This application stores no payment record, so accepted quotation value is quoted value — it is never reported as revenue.",
  );

  return {
    period,
    comparison,
    filters,
    activity: {
      callsMade,
      uniqueLeadsContacted,
      conversations,
      interestedLeads,
      followUpsDue,
      followUpsOverdue,
      previous: {
        callsMade: countCalls(previousEvents),
        uniqueLeadsContacted: countUniqueLeads(previousEvents),
        conversations: countConversations(previousEvents),
        interestedLeads: countInterestedLeads(previousEvents),
      },
    },
    pipeline: {
      activeLeads,
      byStage: stageDistribution(leads).filter((entry) =>
        (ACTIVE_LEAD_STATUSES as readonly string[]).includes(entry.status),
      ),
      quotesAwaitingDecision,
      expiringQuotes,
      leadsRequiringAttention,
    },
    quotes: {
      created: createdInPeriod.length,
      sent: sentInPeriod.length,
      accepted: acceptedInPeriod.length,
      rejected: rejectedInPeriod.length,
      acceptance,
      outstanding,
      acceptedValue,
    },
    funnel: buildCohortFunnel({ cohortLeads, quotes }),
    funnelCohortSize: cohortLeads.length,
    trend: dailyTrend(events, period),
    outcomes: outcomeHistogram(events),
    byMarket,
    byNiche,
    actions,
    dataNotes,
  };
}

/**
 * Normalises persisted rule state into the `configs` map the evaluator expects,
 * filling in defaults for rules that have never been saved.
 */
export function configsFromRuleStates(
  states: Array<{ key: AutomationRuleKey; config: RuleConfig }>,
): Record<AutomationRuleKey, RuleConfig> {
  const configs = {} as Record<AutomationRuleKey, RuleConfig>;
  for (const state of states) {
    configs[state.key] = normaliseConfig(state.key, state.config);
  }
  return configs;
}
