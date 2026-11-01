/**
 * Server-only composition for the two Phase 5 pages.
 *
 * Pages call these functions; they never assemble SQL or metrics themselves, so
 * the dashboard and the API cannot drift apart.
 */

import { loadRuleStates, loadOpenAlerts, loadRecentRuns } from "@/lib/automation/repository";
import type { AutomationAlert, AutomationRuleKey, AutomationRun, RuleConfig, RuleState } from "@/lib/automation/types";
import { buildAnalyticsDashboard, configsFromRuleStates } from "./dashboard";
import { previousPeriod, resolvePeriod, type AnalyticsPeriod } from "./period";
import { loadAnalyticsSnapshot } from "./repository";
import type { AnalyticsDashboard } from "./types";

export type AnalyticsQuery = {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  marketCode?: string | null;
  nicheCategoryId?: string | null;
};

function splitConfigs(states: RuleState[]): {
  configs: Record<AutomationRuleKey, RuleConfig>;
  enabled: Record<AutomationRuleKey, boolean>;
} {
  const enabled = {} as Record<AutomationRuleKey, boolean>;
  for (const state of states) enabled[state.key] = state.enabled;
  return { configs: configsFromRuleStates(states), enabled };
}

export type AnalyticsPageData = {
  dashboard: AnalyticsDashboard;
  ruleStates: RuleState[];
};

export async function loadAnalyticsPageData(query: AnalyticsQuery): Promise<AnalyticsPageData> {
  const period = resolvePeriod(query);
  const comparison = previousPeriod(period);
  const filters = {
    marketCode: query.marketCode ?? null,
    nicheCategoryId: query.nicheCategoryId ?? null,
  };

  const [snapshot, ruleStates] = await Promise.all([
    loadAnalyticsSnapshot({ period, previous: comparison, filters }),
    loadRuleStates(),
  ]);

  const { configs, enabled } = splitConfigs(ruleStates);

  const dashboard = buildAnalyticsDashboard({
    snapshot,
    period,
    comparison,
    filters,
    configs,
    enabled,
  });

  return { dashboard, ruleStates };
}

export type AutomationPageData = {
  ruleStates: RuleState[];
  alerts: AutomationAlert[];
  runs: AutomationRun[];
};

export async function loadAutomationPageData(): Promise<AutomationPageData> {
  const [ruleStates, alerts, runs] = await Promise.all([
    loadRuleStates(),
    loadOpenAlerts(),
    loadRecentRuns(5),
  ]);
  return { ruleStates, alerts, runs };
}

/** Shared by the API routes so the period contract is identical everywhere. */
export function periodFromQuery(query: AnalyticsQuery): AnalyticsPeriod {
  return resolvePeriod(query);
}