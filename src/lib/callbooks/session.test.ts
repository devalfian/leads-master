import { describe, expect, it } from "vitest";
import {
  createSnapshot,
  foldSessionPath,
  navigationState,
  parseSnapshot,
  serializeSnapshot,
} from "./session";
import type { SessionStepInput } from "./session";
import type { CallBranch, CallNode, CallNodeType, CallbookGraph } from "./types";

function node(
  id: string,
  overrides: Partial<CallNode> = {},
  type: CallNodeType = "message",
): CallNode {
  return {
    id,
    type,
    title: id,
    script: `Script for ${id}`,
    internalNote: null,
    position: { x: 0, y: 0 },
    outcomeKey: type === "outcome" ? "meeting_booked" : null,
    branches: [],
    sortOrder: 0,
    stepType: null,
    purpose: null,
    talkingPoints: [],
    ...overrides,
  };
}

function branch(id: string, label: string, nextNodeId: string | null): CallBranch {
  return { id, label, examplePhrases: [`“${label}”`], nextNodeId, sortOrder: 0 };
}

function graph(): CallbookGraph {
  return {
    startNodeId: "opening",
    nodes: [
      node("opening", {
        branches: [branch("b1", "Interested", "value"), branch("b2", "Busy", "callback")],
      }),
      node("value", { branches: [branch("b3", "Book it", "meeting")] }),
      node("callback", { branches: [branch("b4", "Offers a time", "meeting")] }),
      node("meeting", { title: "Meeting booked" }, "outcome"),
    ],
  };
}

function snapshot(version = 1) {
  return createSnapshot(graph(), {
    callbookId: "callbook-1",
    callbookTitle: "Contractor outreach",
    version,
    capturedAt: "2026-02-01T09:00:00.000Z",
  });
}

describe("published snapshot", () => {
  it("captures the graph and keeps the version", () => {
    const snap = snapshot(3);
    expect(snap.version).toBe(3);
    expect(snap.startNodeId).toBe("opening");
    expect(snap.nodes).toHaveLength(4);
  });

  it("is isolated from later edits to the draft graph", () => {
    const draft = graph();
    const snap = createSnapshot(draft, {
      callbookId: "callbook-1",
      callbookTitle: "Contractor outreach",
      version: 1,
      capturedAt: "2026-02-01T09:00:00.000Z",
    });

    draft.nodes[0]!.script = "Edited after publishing";
    draft.nodes[0]!.branches[0]!.label = "Renamed response";

    expect(snap.nodes[0]!.script).toBe("Script for opening");
    expect(snap.nodes[0]!.branches[0]!.label).toBe("Interested");
  });

  it("round-trips through JSON and rejects malformed snapshots", () => {
    const snap = snapshot();
    expect(parseSnapshot(serializeSnapshot(snap))).toEqual(snap);

    expect(parseSnapshot("not json")).toBeNull();
    expect(parseSnapshot("{}")).toBeNull();

    const brokenTarget = {
      ...snap,
      nodes: [
        snap.nodes[0],
        { ...snap.nodes[1]!, branches: [branch("b9", "Ghost", "missing-node")] },
      ],
    };
    expect(parseSnapshot(JSON.stringify(brokenTarget))).toBeNull();

    expect(parseSnapshot(JSON.stringify({ ...snap, startNodeId: "missing" }))).toBeNull();
  });

  it("refuses to build a snapshot without a starting node", () => {
    expect(() =>
      createSnapshot(
        { startNodeId: null, nodes: [] },
        {
          callbookId: "c",
          callbookTitle: "t",
          version: 1,
          capturedAt: "2026-02-01T09:00:00.000Z",
        },
      ),
    ).toThrow();
  });
});

function steps(...entries: SessionStepInput[]): SessionStepInput[] {
  return entries;
}

describe("session path folding", () => {
  it("follows the selected branches", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "advance", fromNodeId: "value", toNodeId: "meeting" },
      ),
    );

    expect(result.path).toEqual(["opening", "value", "meeting"]);
    expect(result.currentNodeId).toBe("meeting");
  });

  it("goes back one step at a time and stops at the start", () => {
    const result = navigationState(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "advance", fromNodeId: "value", toNodeId: "meeting" },
        { kind: "back", fromNodeId: "meeting", toNodeId: "value" },
        { kind: "back", fromNodeId: "value", toNodeId: "opening" },
        { kind: "back", fromNodeId: "opening", toNodeId: null },
      ),
    );

    expect(result.path).toEqual(["opening"]);
    expect(result.canGoBack).toBe(false);
  });

  it("replaces the forward route when a different response is chosen after going back", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "advance", fromNodeId: "value", toNodeId: "meeting" },
        { kind: "back", fromNodeId: "meeting", toNodeId: "value" },
        { kind: "back", fromNodeId: "value", toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "callback" },
        { kind: "advance", fromNodeId: "callback", toNodeId: "meeting" },
      ),
    );

    expect(result.path).toEqual(["opening", "callback", "meeting"]);
    expect(result.divergences).toBe(0);
  });

  it("drops a stale forward route when a branch is chosen from an earlier step", () => {
    // Defensive rule: if the log ever advances from a step that is not the end of
    // the route, everything after it is discarded instead of being kept.
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "advance", fromNodeId: "value", toNodeId: "meeting" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "callback" },
      ),
    );

    expect(result.path).toEqual(["opening", "callback"]);
    expect(result.divergences).toBe(1);
  });

  it("keeps the current step when an unexpected answer is only recorded", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "unexpected", fromNodeId: "value", toNodeId: null },
      ),
    );

    expect(result.path).toEqual(["opening", "value"]);
    expect(result.currentNodeId).toBe("value");
  });

  it("advances when an unexpected answer is mapped to a branch", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "unexpected", fromNodeId: "opening", toNodeId: "callback" },
      ),
    );

    expect(result.path).toEqual(["opening", "callback"]);
  });

  it("ignores nodes that are not part of the snapshot", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "not-in-snapshot" },
      ),
    );

    expect(result.path).toEqual(["opening"]);
  });

  it("never duplicates a transition to the current node", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
      ),
    );

    expect(result.path).toEqual(["opening", "value"]);
  });

  it("restarts from the starting node", () => {
    const result = foldSessionPath(
      snapshot(),
      steps(
        { kind: "start", fromNodeId: null, toNodeId: "opening" },
        { kind: "advance", fromNodeId: "opening", toNodeId: "value" },
        { kind: "restart", fromNodeId: "value", toNodeId: "opening" },
      ),
    );

    expect(result.path).toEqual(["opening"]);
  });
});