import { describe, expect, it } from "vitest";
import {
  addBranch,
  appendBranch,
  canonicalizeGraph,
  connectBranch,
  countUnconnectedBranches,
  createBranch,
  createMessageNode,
  createOutcomeNode,
  deleteNode,
  findCycleNodeIds,
  findNode,
  moveNode,
  reachableNodeIds,
  resolveBranch,
  setStartNode,
  validateGraph,
} from "./graph";
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

function branch(id: string, label: string, nextNodeId: string | null, sortOrder = 0): CallBranch {
  return { id, label, examplePhrases: [], nextNodeId, sortOrder };
}

/**
 * opening --interested--> value --yes--> meeting (outcome)
 *         --busy--> callback --time--> meeting
 *         --no--> close (outcome)
 */
function sampleGraph(): CallbookGraph {
  return {
    startNodeId: "opening",
    nodes: [
      node("opening", {
        branches: [
          branch("b1", "Interested", "value", 0),
          branch("b2", "Busy", "callback", 1),
          branch("b3", "Not interested", "close", 2),
        ],
      }),
      node("value", { branches: [branch("b4", "Yes", "meeting", 0)] }),
      node("callback", { branches: [branch("b5", "Gives a time", "meeting", 0)] }),
      node("meeting", { title: "Meeting booked" }, "outcome"),
      node("close", { title: "Polite closing", outcomeKey: "not_interested" }, "outcome"),
    ],
  };
}

describe("validateGraph", () => {
  it("accepts a connected graph with reachable outcomes", () => {
    const result = validateGraph(sampleGraph());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.stats).toMatchObject({
      nodeCount: 5,
      messageNodeCount: 3,
      outcomeNodeCount: 2,
      branchCount: 5,
      connectedBranchCount: 5,
    });
  });

  it("reports a missing starting node", () => {
    const graph = sampleGraph();
    graph.startNodeId = null;
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain("start_node_missing");
  });

  it("reports a starting node that is not part of the graph", () => {
    const graph = sampleGraph();
    graph.startNodeId = "deleted-node";
    const result = validateGraph(graph);
    expect(result.errors.map((issue) => issue.code)).toContain("start_node_invalid");
  });

  it("rejects an unconnected response branch", () => {
    const graph = sampleGraph();
    graph.nodes[0]!.branches[1]!.nextNodeId = null;
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain("branch_unconnected");
  });

  it("rejects a branch that points at a node that does not exist", () => {
    const graph = sampleGraph();
    graph.nodes[0]!.branches[0]!.nextNodeId = "ghost";
    const result = validateGraph(graph);
    expect(result.ok).toBe(false);
    expect(result.errors.map((issue) => issue.code)).toContain("branch_target_missing");
  });

  it("rejects a self-connection", () => {
    const graph = sampleGraph();
    graph.nodes[0]!.branches[0]!.nextNodeId = "opening";
    const result = validateGraph(graph);
    expect(result.errors.map((issue) => issue.code)).toContain("branch_self_connection");
  });

  it("allows loops between steps, reporting them as a warning", () => {
    const graph = sampleGraph();
    graph.nodes[1]!.branches[0]!.nextNodeId = "opening";
    const result = validateGraph(graph);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings.map((issue) => issue.code)).toContain("cycle_detected");
  });

  it("terminates traversal on a loop", () => {
    const graph = sampleGraph();
    graph.nodes[1]!.branches[0]!.nextNodeId = "opening";
    // The visited set must stop the walk instead of following the loop forever.
    expect(reachableNodeIds(graph).size).toBe(graph.nodes.length);
    expect(findCycleNodeIds(graph).length).toBeGreaterThan(0);
  });

  it("warns about unreachable nodes without blocking", () => {
    const graph = sampleGraph();
    graph.nodes.push(node("orphan", { branches: [branch("b9", "Close", "close", 0)] }));
    const result = validateGraph(graph);
    expect(result.ok).toBe(true);
    expect(result.warnings.map((issue) => issue.code)).toContain("node_unreachable");
  });

  it("requires at least one terminal outcome", () => {
    const graph: CallbookGraph = {
      startNodeId: "a",
      nodes: [node("a", { branches: [branch("b1", "Continue", "a2", 0)] }), node("a2")],
    };
    expect(validateGraph(graph).errors.map((issue) => issue.code)).toContain("no_outcome_nodes");
    expect(
      validateGraph(graph, { requireOutcome: false }).errors.map((issue) => issue.code),
    ).not.toContain("no_outcome_nodes");
  });

  it("requires scripts, titles and response labels", () => {
    const graph: CallbookGraph = {
      startNodeId: "a",
      nodes: [node("a", { script: "  ", branches: [branch("b1", "", null, 0)] }), node("o", {}, "outcome")],
    };
    const codes = validateGraph(graph).errors.map((issue) => issue.code);
    expect(codes).toContain("node_script_missing");
    expect(codes).toContain("branch_label_missing");
    expect(codes).toContain("branch_unconnected");
  });

  it("rejects responses on an outcome step", () => {
    const graph = sampleGraph();
    graph.nodes[3]!.branches = [branch("x", "Something", "close", 0)];
    expect(validateGraph(graph).errors.map((issue) => issue.code)).toContain(
      "outcome_has_branches",
    );
  });

  it("requires a valid outcome category on outcome steps", () => {
    const graph = sampleGraph();
    graph.nodes[3]!.outcomeKey = "not_a_real_outcome";
    expect(validateGraph(graph).errors.map((issue) => issue.code)).toContain(
      "outcome_key_missing",
    );
  });
});

describe("graph mutations", () => {
  it("creates a message node without mutating the source graph", () => {
    const empty: CallbookGraph = { startNodeId: null, nodes: [] };
    const created = createMessageNode(empty);
    expect(created.type).toBe("message");
    expect(created.branches).toEqual([]);
    expect(empty.nodes).toHaveLength(0);
  });

  it("creates outcome nodes with an outcome category", () => {
    const outcome = createOutcomeNode({ startNodeId: null, nodes: [] });
    expect(outcome.type).toBe("outcome");
    expect(outcome.outcomeKey).toBe("meeting_booked");
  });

  it("appends responses without touching the original graph", () => {
    const graph = sampleGraph();
    const first = createBranch(findNode(graph, "value")!);
    const withBranch = appendBranch(graph, "value", first);

    expect(first.id).toBeTruthy();
    expect(countUnconnectedBranches(findNode(withBranch, "value")!)).toBe(1);
    expect(findNode(graph, "value")!.branches).toHaveLength(1);
  });

  it("connects a response to an existing step and rejects self-connection", () => {
    const created = addBranch(sampleGraph(), "value");
    const graph = created.graph;
    const branchId = created.branch!.id;

    expect(connectBranch(graph, "value", branchId, "value").ok).toBe(false);

    const result = connectBranch(graph, "value", branchId, "close");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const resolved = resolveBranch(result.graph, "value", branchId);
    expect(resolved.ok).toBe(true);
    if (resolved.ok) expect(resolved.nextNode.id).toBe("close");
  });

  it("allows many responses to point at the same step", () => {
    const graph = sampleGraph();
    const viaValue = resolveBranch(graph, "value", "b4");
    const viaCallback = resolveBranch(graph, "callback", "b5");
    expect(viaValue.ok && viaValue.nextNode.id).toBe("meeting");
    expect(viaCallback.ok && viaCallback.nextNode.id).toBe("meeting");
    // A single response can only ever lead to one step.
    const opening = resolveBranch(graph, "opening", "b1");
    expect(opening.ok && opening.nextNode.id).toBe("value");
  });

  it("does not redirect incoming branches when a step is deleted", () => {
    const result = deleteNode(sampleGraph(), "meeting");
    expect(result.disconnectedBranchCount).toBe(2);
    expect(result.wasStartNode).toBe(false);

    expect(findNode(result.graph, "value")!.branches[0]!.nextNodeId).toBeNull();
    expect(findNode(result.graph, "callback")!.branches[0]!.nextNodeId).toBeNull();

    const unconnected = validateGraph(result.graph).errors.filter(
      (issue) => issue.code === "branch_unconnected",
    );
    expect(unconnected).toHaveLength(2);
  });

  it("clears the starting node when it is deleted instead of picking another", () => {
    const result = deleteNode(sampleGraph(), "opening");
    expect(result.wasStartNode).toBe(true);
    expect(result.graph.startNodeId).toBeNull();
    expect(validateGraph(result.graph).errors.map((issue) => issue.code)).toContain(
      "start_node_missing",
    );
  });

  it("sets an explicit starting node and ignores unknown ids", () => {
    const graph = setStartNode(sampleGraph(), "value");
    expect(graph.startNodeId).toBe("value");
    expect(setStartNode(graph, "missing").startNodeId).toBe("value");
  });

  it("reorders steps without touching ids or connections", () => {
    const graph = sampleGraph();
    const originalIds = graph.nodes.map((node) => node.id);
    const moved = moveNode(graph, "value", -1);

    expect(moved.nodes.map((node) => node.id)).not.toEqual(originalIds);
    expect(moved.nodes.map((node) => node.id)[0]).toBe("value");
    expect(moved.nodes.map((node) => node.sortOrder)).toEqual(
      moved.nodes.map((_, index) => index),
    );
    expect(new Set(moved.nodes.map((node) => node.id))).toEqual(new Set(originalIds));
    // Branch destinations still resolve to the same step.
    expect(findNode(moved, "opening")!.branches[0]!.nextNodeId).toBe("value");

    // Boundary moves are no-ops, not errors.
    expect(moveNode(graph, originalIds[0]!, -1)).toBe(graph);
    expect(moveNode(graph, originalIds.at(-1)!, 1)).toBe(graph);
  });
});

describe("traversal helpers", () => {
  it("finds reachable nodes from the start", () => {
    const reachable = reachableNodeIds(sampleGraph());
    expect([...reachable].sort()).toEqual(["callback", "close", "meeting", "opening", "value"]);
  });

  it("reports why a response cannot be followed", () => {
    const graph = sampleGraph();
    expect(resolveBranch(graph, "opening", "missing")).toEqual({
      ok: false,
      reason: "branch_not_found",
    });

    graph.nodes[0]!.branches[0]!.nextNodeId = null;
    expect(resolveBranch(graph, "opening", "b1")).toEqual({ ok: false, reason: "unconnected" });

    graph.nodes[0]!.branches[0]!.nextNodeId = "ghost";
    expect(resolveBranch(graph, "opening", "b1")).toEqual({
      ok: false,
      reason: "target_missing",
    });
  });
});

describe("canonicalizeGraph", () => {
  it("ignores node array order but tracks content changes", () => {
    const a = sampleGraph();
    const b = sampleGraph();
    b.nodes.reverse();
    expect(canonicalizeGraph(a)).toBe(canonicalizeGraph(b));

    b.nodes[0]!.script = "Changed";
    expect(canonicalizeGraph(a)).not.toBe(canonicalizeGraph(b));
  });
});