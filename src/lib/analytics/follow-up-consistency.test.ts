import { describe, expect, it } from "vitest";

/**
 * Cross-feature agreement for follow-ups.
 *
 * A follow-up is stored in two shapes: a calendar day from the lead forms and a full
 * UTC instant from a completed Callbook call. These tests pin the single rule every
 * consumer applies — the lead page, the dashboard counters, Analytics and the
 * automation queue — so one record can never be "due today" on one screen and
 * "overdue" on another.
 */

import { defaultRuleStates } from "@/lib/automation/types";
import type { AutomationRuleKey } from "@/lib/automation/types";
import { evaluateRule } from "@/lib/automation/rules";
import {
  followUpDay,
  isFollowUpOverdue,
  isFollowUpPending,
} from "@/lib/leads/follow-up-time";
import { buildAnalyticsDashboard, configsFromRuleStates } from "./dashboard";
import { resolvePeriod, todayInReportingZone } from "./period";
import type { AnalyticsSnapshot, FollowUpSnapshot, LeadSnapshot } from "./types";

// 10:00 WIB on 2 November 2026 — already 2 November in the reporting zone.
const NOW = new Date("2026-11-02T03:00:00.000Z");
const TODAY = todayInReportingZone(NOW);

function lead(overrides: Partial<LeadSnapshot> = {}): LeadSnapshot {
  return {
    id: "lead_1",
    businessName: "Harbour Plumbing",
    marketId: "market_usa",
    marketCode: "USA",
    marketName: "United States",
    nicheCategoryId: null,
    nicheName: null,
    city: null,
    status: "contacted",
    doNotContact: false,
    archivedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    callCount: 1,
    sessionCount: 0,
    lastContactAt: "2026-10-01T00:00:00.000Z",
    nextFollowUpAt: null,
    lastOutcomeKey: "meeting_booked",
    hasInterest: true,
    hasConversation: true,
    ...overrides,
  };
}

function followUp(overrides: Partial<FollowUpSnapshot> = {}): FollowUpSnapshot {
  return {
    id: "fu_1",
    leadId: "lead_1",
    leadName: "Harbour Plumbing",
    marketCode: "USA",
    marketName: "United States",
    nicheName: null,
    dueAt: TODAY,
    type: "call_back",
    notes: "",
    status: "scheduled",
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function snapshot(followUps: FollowUpSnapshot[], leads: LeadSnapshot[]): AnalyticsSnapshot {
  return {
    events: [],
    previousEvents: [],
    leads,
    followUps,
    quotes: [],
    eventsTruncated: false,
  };
}

function configs() {
  return configsFromRuleStates(defaultRuleStates());
}

function enabled(): Record<AutomationRuleKey, boolean> {
  const map = {} as Record<AutomationRuleKey, boolean>;
  for (const state of defaultRuleStates()) map[state.key] = true;
  return map;
}

function dashboardFor(data: AnalyticsSnapshot) {
  return buildAnalyticsDashboard({
    snapshot: data,
    period: resolvePeriod({ preset: "30d", now: NOW }),
    filters: { marketCode: null, nicheCategoryId: null },
    now: NOW,
    configs: configs(),
    enabled: enabled(),
  });
}

describe("follow-up day semantics", () => {
  it("treats a calendar day and an instant on that day as the same day", () => {
    expect(TODAY).toBe("2026-11-02");
    expect(followUpDay(TODAY)).toBe("2026-11-02");
    expect(followUpDay("2026-11-02T01:00:00.000Z")).toBe("2026-11-02");
    // 00:30 WIB on 2 November is still 1 November in UTC — the operator's day wins.
    expect(followUpDay("2026-11-01T17:30:00.000Z")).toBe("2026-11-02");
  });

  it("counts a follow-up due today as still ahead, and yesterday as overdue", () => {
    expect(isFollowUpOverdue(TODAY, TODAY)).toBe(false);
    expect(isFollowUpPending(TODAY, TODAY)).toBe(true);
    expect(isFollowUpOverdue("2026-11-01", TODAY)).toBe(true);
    expect(isFollowUpPending("2026-11-01", TODAY)).toBe(false);
    expect(isFollowUpPending("2026-11-03", TODAY)).toBe(true);
  });
});

describe("dashboard and automation agree on the same follow-up", () => {
  it("reports a follow-up due today as due, not overdue, in both places", () => {
    const data = snapshot([followUp()], [lead()]);

    const dashboard = dashboardFor(data);
    expect(dashboard.activity.followUpsDue).toBe(1);
    expect(dashboard.activity.followUpsOverdue).toBe(0);

    const alerts = evaluateRule("overdue_followups", {
      snapshot: data,
      now: NOW,
      today: TODAY,
      configs: configs(),
    });
    expect(alerts).toHaveLength(0);
  });

  it("reports yesterday as overdue in both places", () => {
    const yesterday = followUp({ dueAt: "2026-11-01" });
    const data = snapshot([yesterday], [lead()]);

    expect(dashboardFor(data).activity.followUpsOverdue).toBe(1);

    const alerts = evaluateRule("overdue_followups", {
      snapshot: data,
      now: NOW,
      today: TODAY,
      configs: configs(),
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.entityId).toBe(yesterday.id);
  });

  it("keeps an interested lead with a follow-up pending today out of the queue", () => {
    const pending = snapshot([followUp()], [lead({ nextFollowUpAt: TODAY })]);
    expect(
      evaluateRule("interested_no_next_action", {
        snapshot: pending,
        now: NOW,
        today: TODAY,
        configs: configs(),
      }),
    ).toHaveLength(0);

    // Without a follow-up the same lead is exactly what the rule is for.
    const missing = snapshot([], [lead()]);
    expect(
      evaluateRule("interested_no_next_action", {
        snapshot: missing,
        now: NOW,
        today: TODAY,
        configs: configs(),
      }),
    ).toHaveLength(1);
  });

  it("keeps a stale-looking lead with a follow-up pending today out of the queue", () => {
    const pending = snapshot([followUp()], [lead({ nextFollowUpAt: TODAY })]);
    expect(
      evaluateRule("stale_leads", {
        snapshot: pending,
        now: NOW,
        today: TODAY,
        configs: configs(),
      }),
    ).toHaveLength(0);

    const missing = snapshot([], [lead()]);
    expect(
      evaluateRule("stale_leads", {
        snapshot: missing,
        now: NOW,
        today: TODAY,
        configs: configs(),
      }),
    ).toHaveLength(1);
  });
});