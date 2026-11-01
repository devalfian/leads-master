/**
 * Automation rule catalogue.
 *
 * Every rule is a deterministic query over records that already exist. None of
 * them writes to a lead, a call, a follow-up or a quotation, and none of them
 * sends anything: this application has no email, SMS, WhatsApp or push
 * integration, so "notification" here means an entry in the in-app queue.
 *
 * Execution: there is no scheduler configured for this deployment (no
 * `triggers.crons` in `wrangler.jsonc`, and OpenNext runs request-scoped
 * Workers), so rules are evaluated **on demand** — from the Automation page or
 * from the run API. The UI says so; nothing claims to run in the background.
 */

import type { ActionPriority } from "@/lib/analytics/types";

export const AUTOMATION_RULE_KEYS = [
  "overdue_followups",
  "quote_expiring",
  "stale_leads",
  "interested_no_next_action",
  "quote_awaiting_decision",
] as const;

export type AutomationRuleKey = (typeof AUTOMATION_RULE_KEYS)[number];

export function isAutomationRuleKey(value: unknown): value is AutomationRuleKey {
  return typeof value === "string" && (AUTOMATION_RULE_KEYS as readonly string[]).includes(value);
}

export type RuleConfigField = {
  key: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  defaultValue: number;
};

export type AutomationRuleDefinition = {
  key: AutomationRuleKey;
  name: string;
  description: string;
  /** The exact condition, in words, so the user can predict what will fire. */
  trigger: string;
  priority: ActionPriority;
  configFields: RuleConfigField[];
  defaultConfig: Record<string, number>;
  /** No rule can run without a request; the UI must not imply otherwise. */
  execution: "on_demand";
};

export const AUTOMATION_RULES: readonly AutomationRuleDefinition[] = [
  {
    key: "overdue_followups",
    name: "Overdue follow-ups",
    description:
      "Raises one reminder per scheduled follow-up whose due day has passed and which has not been completed or cancelled. A follow-up due today is not overdue.",
    trigger: "follow_ups.status = 'scheduled' AND follow-up day < today (reporting zone)",
    priority: "high",
    configFields: [],
    defaultConfig: {},
    execution: "on_demand",
  },
  {
    key: "quote_expiring",
    name: "Quotation expiring soon",
    description:
      "Raises one reminder per sent quotation whose valid-until date falls inside the reminder window. Accepted, rejected and cancelled quotations are never included.",
    trigger: "quotes.status = 'sent' AND today <= valid_until <= today + windowDays",
    priority: "high",
    configFields: [
      {
        key: "windowDays",
        label: "Reminder window (days before expiry)",
        hint: "A product default, not a business policy. Set it to what you actually want to be reminded about.",
        min: 1,
        max: 30,
        defaultValue: 3,
      },
    ],
    defaultConfig: { windowDays: 3 },
    execution: "on_demand",
  },
  {
    key: "stale_leads",
    name: "Stale leads",
    description:
      "Raises one reminder per active lead with no recorded contact and no scheduled follow-up for longer than the threshold.",
    trigger:
      "lead active AND not do-not-contact AND no follow-up due today or later AND last contact (or creation) older than staleDays",
    priority: "low",
    configFields: [
      {
        key: "staleDays",
        label: "Days without contact",
        hint: "A user-adjustable heuristic for this workspace. It is not an industry benchmark.",
        min: 1,
        max: 365,
        defaultValue: 7,
      },
    ],
    defaultConfig: { staleDays: 7 },
    execution: "on_demand",
  },
  {
    key: "interested_no_next_action",
    name: "Interested lead without a next action",
    description:
      "Raises one reminder per lead with a recorded interest outcome but no scheduled follow-up and no quotation awaiting a decision.",
    trigger: "interest outcome recorded AND no follow-up due today or later AND no sent quotation",
    priority: "medium",
    configFields: [],
    defaultConfig: {},
    execution: "on_demand",
  },
  {
    key: "quote_awaiting_decision",
    name: "Quotation awaiting a decision",
    description:
      "Raises one reminder per sent quotation that has no recorded acceptance or rejection once it has been pending for longer than the threshold.",
    trigger: "quotes.status = 'sent' AND sent_at <= now - pendingDays",
    priority: "medium",
    configFields: [
      {
        key: "pendingDays",
        label: "Days pending before a reminder",
        hint: "Counted from the recorded sent date only. A quotation with no sent date is flagged separately.",
        min: 1,
        max: 90,
        defaultValue: 5,
      },
    ],
    defaultConfig: { pendingDays: 5 },
    execution: "on_demand",
  },
];

const RULES_BY_KEY: Record<AutomationRuleKey, AutomationRuleDefinition> = AUTOMATION_RULES.reduce(
  (acc, rule) => {
    acc[rule.key] = rule;
    return acc;
  },
  {} as Record<AutomationRuleKey, AutomationRuleDefinition>,
);

export function getRuleDefinition(key: AutomationRuleKey): AutomationRuleDefinition {
  return RULES_BY_KEY[key];
}

export type RuleConfig = Record<string, number>;

/**
 * Clamps stored config to the declared bounds. A row edited by hand, or written
 * before a bound changed, can therefore never produce a nonsensical window.
 */
export function normaliseConfig(
  key: AutomationRuleKey,
  raw: Record<string, unknown> | null | undefined,
): RuleConfig {
  const definition = RULES_BY_KEY[key];
  const config: RuleConfig = { ...definition.defaultConfig };
  if (!raw) return config;

  for (const field of definition.configFields) {
    const value = raw[field.key];
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) continue;
    config[field.key] = Math.min(Math.max(Math.round(parsed), field.min), field.max);
  }
  return config;
}

export type RuleState = {
  key: AutomationRuleKey;
  enabled: boolean;
  config: RuleConfig;
  updatedAt: string | null;
};

/** Default state used before anything has been saved, and for new rules. */
export function defaultRuleStates(): RuleState[] {
  return AUTOMATION_RULES.map((rule) => ({
    key: rule.key,
    enabled: true,
    config: { ...rule.defaultConfig },
    updatedAt: null,
  }));
}

export type AutomationAlert = {
  id: string;
  ruleKey: string;
  entityType: "follow_up" | "quote" | "lead";
  entityId: string;
  leadId: string | null;
  title: string;
  message: string;
  priority: ActionPriority;
  dueAt: string | null;
  status: "open" | "resolved";
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
};

export type AutomationRun = {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: "success" | "error";
  rulesEvaluated: number;
  alertsOpened: number;
  alertsResolved: number;
  errorMessage: string | null;
};

export type EvaluationSummary = {
  run: AutomationRun;
  openAlerts: AutomationAlert[];
  /** Rules skipped because the operator disabled them. */
  skippedRules: AutomationRuleKey[];
};
