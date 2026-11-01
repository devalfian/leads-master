import { describe, expect, it } from "vitest";
import { applyOptimisticAdvance, applyOptimisticBack, applyOptimisticNote } from "./optimistic";
import type { CallNode, CallSessionDetail } from "./types";

/**
 * Call Mode keeps working without a connection by moving the view locally.
 *
 * These tests pin two things: the local move matches what the server would do
 * for the same branch, and anything that cannot be shown locally returns `null`
 * so the caller queues nothing and the server stays the only authority.
 */

function node(overrides: Partial<CallNode> & Pick<CallNode, "id">): CallNode {
  return {
    type: "message",
    title: overrides.id,
    script: "",
    internalNote: null,
    position: { x: 0, y: 0 },
    outcomeKey: null,
    branches: [],
    sortOrder: 0,
    stepType: null,
    purpose: null,
    talkingPoints: [],
    ...overrides,
  };
}

const OPENING = node({
  id: "n1",
  title: "Opening",
  branches: [
    { id: "b1", label: "Yes, go ahead", examplePhrases: [], nextNodeId: "n2", sortOrder: 0 },
    { id: "bx", label: "Not connected", examplePhrases: [], nextNodeId: null, sortOrder: 1 },
  ],
});

const DISCOVERY = node({
  id: "n2",
  title: "Discovery",
  branches: [
    { id: "b2", label: "Has a site", examplePhrases: [], nextNodeId: "n3", sortOrder: 0 },
  ],
});

const CLOSE = node({ id: "n3", type: "outcome", title: "Close", outcomeKey: "meeting_booked" });

const MISSING_TARGET = node({
  id: "n4",
  title: "Broken",
  branches: [
    { id: "b4", label: "To nowhere", examplePhrases: [], nextNodeId: "gone", sortOrder: 0 },
  ],
});

function session(overrides: Partial<CallSessionDetail> = {}): CallSessionDetail {
  return {
    id: "s-1",
    callbookId: "cb-1",
    callbookTitle: "Northbay F&B — no website",
    publishedVersion: 3,
    prospectName: "Warung Sari",
    leadId: "lead-1",
    status: "in_progress",
    currentNodeId: "n1",
    path: ["n1"],
    notes: "",
    outcomeKey: null,
    nextAction: null,
    followUpAt: null,
    startedAt: "2026-01-01T08:00:00.000Z",
    endedAt: null,
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-01-01T08:00:00.000Z",
    snapshot: {
      version: 3,
      callbookId: "cb-1",
      callbookTitle: "Northbay F&B — no website",
      capturedAt: "2026-01-01T07:00:00.000Z",
      startNodeId: "n1",
      nodes: [OPENING, DISCOVERY, CLOSE, MISSING_TARGET],
    },
    steps: [],
    quickNotes: [],
    ...overrides,
  };
}

const options = { now: () => "2026-01-01T09:00:00.000Z", createId: () => "local-1" };

describe("following a response offline", () => {
  it("moves to the branch target and appends the step", () => {
    const next = applyOptimisticAdvance(session(), "b1", options)!;

    expect(next.currentNodeId).toBe("n2");
    expect(next.path).toEqual(["n1", "n2"]);
    expect(next.updatedAt).toBe("2026-01-01T09:00:00.000Z");
    expect(next.steps).toHaveLength(1);
    expect(next.steps[0]).toMatchObject({
      kind: "advance",
      fromNodeId: "n1",
      branchId: "b1",
      toNodeId: "n2",
      label: "Yes, go ahead",
    });
  });

  it("refuses a branch with no target, or one whose target is gone", () => {
    expect(applyOptimisticAdvance(session(), "bx", options)).toBeNull();
    expect(
      applyOptimisticAdvance(session({ currentNodeId: "n4", path: ["n4"] }), "b4", options),
    ).toBeNull();
    expect(applyOptimisticAdvance(session(), "does-not-exist", options)).toBeNull();
  });

  it("refuses when the current step is not in the snapshot", () => {
    expect(
      applyOptimisticAdvance(session({ currentNodeId: "vanished", path: ["vanished"] }), "b1", options),
    ).toBeNull();
  });

  it("can be applied twice to walk a whole path offline, like the server would", () => {
    const first = applyOptimisticAdvance(session(), "b1", options)!;
    const second = applyOptimisticAdvance(first, "b2", options)!;

    expect(second.path).toEqual(["n1", "n2", "n3"]);
    expect(second.steps.map((step) => step.kind)).toEqual(["advance", "advance"]);
  });
});

describe("stepping back offline", () => {
  it("returns to the previous step", () => {
    const walked = applyOptimisticAdvance(session(), "b1", options)!;
    const back = applyOptimisticBack(walked, options)!;

    expect(back.currentNodeId).toBe("n1");
    expect(back.path).toEqual(["n1"]);
    expect(back.steps[back.steps.length - 1]).toMatchObject({
      kind: "back",
      fromNodeId: "n2",
      toNodeId: "n1",
    });
  });

  it("refuses at the first step", () => {
    expect(applyOptimisticBack(session(), options)).toBeNull();
  });
});

describe("quick notes offline", () => {
  it("appears immediately with a temporary id", () => {
    const withNote = applyOptimisticNote(session(), "  Wants pricing by email  ", options)!;

    expect(withNote.quickNotes).toHaveLength(1);
    expect(withNote.quickNotes[0]).toMatchObject({
      id: "local-1",
      body: "Wants pricing by email",
      createdAt: "2026-01-01T09:00:00.000Z",
    });
  });

  it("refuses an empty note", () => {
    expect(applyOptimisticNote(session(), "   ", options)).toBeNull();
  });
});