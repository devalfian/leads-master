import type { CallBranch, CallNode, CallNodeType, CallbookGraph, CallbookGoal } from "./types";
import { isOutcomeKey } from "./outcomes";

/* -------------------------------------------------------------------------- */
/* Identifiers                                                                */
/* -------------------------------------------------------------------------- */

export function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  // Fallback for exotic runtimes. Identity is never derived from titles.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

export function findNode(graph: CallbookGraph, nodeId: string | null): CallNode | null {
  if (!nodeId) return null;
  return graph.nodes.find((node) => node.id === nodeId) ?? null;
}

export function findBranch(
  graph: CallbookGraph,
  branchId: string,
): { node: CallNode; branch: CallBranch } | null {
  for (const node of graph.nodes) {
    const branch = node.branches.find((candidate) => candidate.id === branchId);
    if (branch) return { node, branch };
  }
  return null;
}

export function sortedBranches(node: CallNode): CallBranch[] {
  return [...node.branches].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function countUnconnectedBranches(node: CallNode): number {
  return node.branches.filter((branch) => branch.nextNodeId === null).length;
}

export function emptyGraph(): CallbookGraph {
  return { startNodeId: null, nodes: [] };
}

/* -------------------------------------------------------------------------- */
/* Node factories                                                             */
/* -------------------------------------------------------------------------- */

/** Deterministic layout so new nodes never stack on top of one another. */
export function nextNodePosition(graph: CallbookGraph): { x: number; y: number } {
  if (graph.nodes.length === 0) return { x: 80, y: 120 };
  const columnHeight = 3;
  const index = graph.nodes.length;
  return {
    x: 80 + Math.floor(index / columnHeight) * 340,
    y: 120 + (index % columnHeight) * 170,
  };
}

export function createMessageNode(
  graph: CallbookGraph,
  position?: { x: number; y: number },
): CallNode {
  return {
    id: createId(),
    type: "message",
    title: "New message",
    script: "",
    internalNote: null,
    position: position ?? nextNodePosition(graph),
    outcomeKey: null,
    branches: [],
    sortOrder: graph.nodes.length,
    stepType: null,
    purpose: null,
    talkingPoints: [],
  };
}

export function createOutcomeNode(
  graph: CallbookGraph,
  position?: { x: number; y: number },
): CallNode {
  return {
    id: createId(),
    type: "outcome",
    title: "Meeting booked",
    script: "",
    internalNote: null,
    position: position ?? nextNodePosition(graph),
    outcomeKey: "meeting_booked",
    branches: [],
    sortOrder: graph.nodes.length,
    stepType: "end",
    purpose: null,
    talkingPoints: [],
  };
}

export function createBranch(node: CallNode): CallBranch {
  return {
    id: createId(),
    label: "",
    examplePhrases: [],
    nextNodeId: null,
    sortOrder: node.branches.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Node mutations (pure)                                                      */
/* -------------------------------------------------------------------------- */

export function addNode(graph: CallbookGraph, node: CallNode): CallbookGraph {
  return { ...graph, nodes: [...graph.nodes, node] };
}

export function updateNode(
  graph: CallbookGraph,
  nodeId: string,
  patch: Partial<Omit<CallNode, "id" | "branches">>,
): CallbookGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
  };
}

export function setStartNode(graph: CallbookGraph, nodeId: string): CallbookGraph {
  if (!findNode(graph, nodeId)) return graph;
  return { ...graph, startNodeId: nodeId };
}

export type DeleteNodeResult = {
  graph: CallbookGraph;
  /** Branches owned by the deleted node (they disappear with it). */
  removedBranchCount: number;
  /** Branches on other nodes that pointed at the deleted node (now unconnected). */
  disconnectedBranchCount: number;
  /** True when the deleted node was the starting node. */
  wasStartNode: boolean;
};

/**
 * Deletes a node. Incoming branches are explicitly *not* redirected: they become
 * unconnected so the user sees exactly what needs re-linking. The starting node is
 * cleared (never silently replaced) if it was the deleted node.
 */
export function deleteNode(graph: CallbookGraph, nodeId: string): DeleteNodeResult {
  const target = findNode(graph, nodeId);
  if (!target) {
    return { graph, removedBranchCount: 0, disconnectedBranchCount: 0, wasStartNode: false };
  }

  let disconnectedBranchCount = 0;
  const nodes = graph.nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (!node.branches.some((branch) => branch.nextNodeId === nodeId)) {
        return node;
      }
      const branches = node.branches.map((branch) => {
        if (branch.nextNodeId !== nodeId) return branch;
        disconnectedBranchCount += 1;
        return { ...branch, nextNodeId: null };
      });
      return { ...node, branches };
    });

  const wasStartNode = graph.startNodeId === nodeId;

  return {
    graph: { startNodeId: wasStartNode ? null : graph.startNodeId, nodes },
    removedBranchCount: target.branches.length,
    disconnectedBranchCount,
    wasStartNode,
  };
}

export function countIncomingBranches(
  graph: CallbookGraph,
  nodeId: string,
): { branchCount: number; nodeTitles: string[] } {
  const nodeTitles: string[] = [];
  let branchCount = 0;
  for (const node of graph.nodes) {
    if (node.id === nodeId) continue;
    for (const branch of node.branches) {
      if (branch.nextNodeId === nodeId) {
        branchCount += 1;
        if (!nodeTitles.includes(node.title)) nodeTitles.push(node.title);
      }
    }
  }
  return { branchCount, nodeTitles };
}

/* -------------------------------------------------------------------------- */
/* Branch mutations (pure)                                                    */
/* -------------------------------------------------------------------------- */

function mapNode(
  graph: CallbookGraph,
  nodeId: string,
  mapper: (node: CallNode) => CallNode,
): CallbookGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => (node.id === nodeId ? mapper(node) : node)),
  };
}

export function addBranch(
  graph: CallbookGraph,
  nodeId: string,
): { graph: CallbookGraph; branch: CallBranch | null } {
  const node = findNode(graph, nodeId);
  if (!node) return { graph, branch: null };
  const branch = createBranch(node);
  return {
    graph: mapNode(graph, nodeId, (current) => ({
      ...current,
      branches: [...current.branches, branch],
    })),
    branch,
  };
}

/** Appends an already-created branch (keeps id creation outside state updaters). */
export function appendBranch(
  graph: CallbookGraph,
  nodeId: string,
  branch: CallBranch,
): CallbookGraph {
  return mapNode(graph, nodeId, (node) => ({
    ...node,
    branches: [...node.branches, branch],
  }));
}

export function updateBranch(
  graph: CallbookGraph,
  nodeId: string,
  branchId: string,
  patch: Partial<Omit<CallBranch, "id">>,
): CallbookGraph {
  return mapNode(graph, nodeId, (node) => ({
    ...node,
    branches: node.branches.map((branch) =>
      branch.id === branchId ? { ...branch, ...patch } : branch,
    ),
  }));
}

export function removeBranch(
  graph: CallbookGraph,
  nodeId: string,
  branchId: string,
): CallbookGraph {
  return mapNode(graph, nodeId, (node) => ({
    ...node,
    branches: node.branches
      .filter((branch) => branch.id !== branchId)
      .map((branch, index) => ({ ...branch, sortOrder: index })),
  }));
}

export function moveBranch(
  graph: CallbookGraph,
  nodeId: string,
  branchId: string,
  direction: -1 | 1,
): CallbookGraph {
  const node = findNode(graph, nodeId);
  if (!node) return graph;
  const ordered = sortedBranches(node);
  const index = ordered.findIndex((branch) => branch.id === branchId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return graph;

  const reordered = [...ordered];
  const [moved] = reordered.splice(index, 1);
  if (!moved) return graph;
  reordered.splice(targetIndex, 0, moved);

  return mapNode(graph, nodeId, (current) => ({
    ...current,
    branches: reordered.map((branch, position) => ({ ...branch, sortOrder: position })),
  }));
}

export type ConnectResult = { ok: true; graph: CallbookGraph } | { ok: false; error: string };

/**
 * Connects a response branch to a target node, rejecting invalid connections.
 * Many branches may point at the same node; a node may have many incoming links.
 */
export function connectBranch(
  graph: CallbookGraph,
  nodeId: string,
  branchId: string,
  targetNodeId: string,
): ConnectResult {
  const source = findNode(graph, nodeId);
  if (!source) return { ok: false, error: "The step you are editing no longer exists." };
  if (!findNode(graph, targetNodeId)) {
    return { ok: false, error: "That next step no longer exists. Pick another one." };
  }
  if (nodeId === targetNodeId) {
    return { ok: false, error: "A response cannot point back to the step it comes from." };
  }
  const branch = source.branches.find((candidate) => candidate.id === branchId);
  if (!branch) return { ok: false, error: "That response no longer exists." };

  return { ok: true, graph: updateBranch(graph, nodeId, branchId, { nextNodeId: targetNodeId }) };
}

export function disconnectBranch(
  graph: CallbookGraph,
  nodeId: string,
  branchId: string,
): CallbookGraph {
  return updateBranch(graph, nodeId, branchId, { nextNodeId: null });
}

/* -------------------------------------------------------------------------- */
/* Traversal                                                                  */
/* -------------------------------------------------------------------------- */

/** Node ids reachable from the starting node by following connected branches. */
export function reachableNodeIds(graph: CallbookGraph): Set<string> {
  const reached = new Set<string>();
  const start = findNode(graph, graph.startNodeId);
  if (!start) return reached;

  const queue: string[] = [start.id];
  reached.add(start.id);

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) break;
    const node = findNode(graph, currentId);
    if (!node) continue;
    for (const branch of node.branches) {
      const nextId = branch.nextNodeId;
      if (!nextId || reached.has(nextId)) continue;
      if (!findNode(graph, nextId)) continue;
      reached.add(nextId);
      queue.push(nextId);
    }
  }
  return reached;
}

/** Returns the ids of nodes that participate in at least one cycle. */
export function findCycleNodeIds(graph: CallbookGraph): string[] {
  const state = new Map<string, 0 | 1 | 2>();
  const inCycle = new Set<string>();

  const visit = (nodeId: string, path: string[]): void => {
    const current = state.get(nodeId) ?? 0;
    if (current === 1) {
      const cycleStart = path.indexOf(nodeId);
      for (const id of path.slice(cycleStart === -1 ? 0 : cycleStart)) inCycle.add(id);
      inCycle.add(nodeId);
      return;
    }
    if (current === 2) return;

    state.set(nodeId, 1);
    const node = findNode(graph, nodeId);
    if (node) {
      for (const branch of node.branches) {
        if (branch.nextNodeId && findNode(graph, branch.nextNodeId)) {
          visit(branch.nextNodeId, [...path, nodeId]);
        }
      }
    }
    state.set(nodeId, 2);
  };

  for (const node of graph.nodes) visit(node.id, []);
  return [...inCycle];
}

/**
 * Resolves the node a response leads to. Returns a discriminated result so callers
 * never silently fall back to an arbitrary node.
 */
export type BranchResolution =
  | { ok: true; branch: CallBranch; nextNode: CallNode }
  | { ok: false; reason: "branch_not_found" | "unconnected" | "target_missing" };

export function resolveBranch(
  graph: CallbookGraph,
  nodeId: string,
  branchId: string,
): BranchResolution {
  const node = findNode(graph, nodeId);
  if (!node) return { ok: false, reason: "branch_not_found" };
  const branch = node.branches.find((candidate) => candidate.id === branchId);
  if (!branch) return { ok: false, reason: "branch_not_found" };
  if (!branch.nextNodeId) return { ok: false, reason: "unconnected" };
  const nextNode = findNode(graph, branch.nextNodeId);
  if (!nextNode) return { ok: false, reason: "target_missing" };
  return { ok: true, branch, nextNode };
}

/**
 * Reorders conversation steps. The array order is the authored order and drives
 * `sortOrder` when the draft is saved. Used by the keyboard-accessible reorder
 * controls in the steps panel.
 */
export function moveNode(graph: CallbookGraph, nodeId: string, direction: -1 | 1): CallbookGraph {
  const index = graph.nodes.findIndex((node) => node.id === nodeId);
  if (index < 0) return graph;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= graph.nodes.length) return graph;

  const reordered = [...graph.nodes];
  const [moved] = reordered.splice(index, 1);
  if (!moved) return graph;
  reordered.splice(targetIndex, 0, moved);

  return {
    ...graph,
    nodes: reordered.map((node, position) => ({ ...node, sortOrder: position })),
  };
}

export function displayTitle(node: CallNode | null): string | null {
  if (!node) return null;
  const title = node.title.trim();
  return title.length > 0 ? title : "Untitled step";
}

export function nodeTypeLabel(type: CallNodeType): string {
  return type === "message" ? "Message" : "Outcome";
}

export function graphStatsLabel(graph: CallbookGraph): string {
  const nodes = graph.nodes.length;
  const branches = graph.nodes.reduce((total, node) => total + node.branches.length, 0);
  return `${nodes} step${nodes === 1 ? "" : "s"} · ${branches} response${branches === 1 ? "" : "s"}`;
}

export function goalLabel(goal: CallbookGoal, labelLookup: Record<CallbookGoal, string>): string {
  return labelLookup[goal];
}

/* -------------------------------------------------------------------------- */
/* Serialisation                                                              */
/* -------------------------------------------------------------------------- */

function roundPosition(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Stable, key-ordered JSON used for "has the draft changed since publish?"
 * comparisons. Node and branch arrays are sorted by id so that array order alone
 * does not count as a content change; branch `sortOrder` is part of the payload.
 */
export function canonicalizeGraph(graph: CallbookGraph): string {
  const nodes = [...graph.nodes]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((node) => ({
      id: node.id,
      type: node.type,
      title: node.title,
      script: node.script,
      internalNote: node.internalNote,
      outcomeKey: node.outcomeKey,
      position: { x: roundPosition(node.position.x), y: roundPosition(node.position.y) },
      branches: [...node.branches]
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        .map((branch) => ({
          id: branch.id,
          label: branch.label,
          examplePhrases: branch.examplePhrases,
          nextNodeId: branch.nextNodeId,
          sortOrder: branch.sortOrder,
        })),
    }));

  return JSON.stringify({ startNodeId: graph.startNodeId, nodes });
}

export async function hashGraph(graph: CallbookGraph): Promise<string> {
  const data = new TextEncoder().encode(canonicalizeGraph(graph));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
  branchId?: string;
};

export type ValidationStats = {
  nodeCount: number;
  messageNodeCount: number;
  outcomeNodeCount: number;
  branchCount: number;
  connectedBranchCount: number;
};

export type ValidationResult = {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: ValidationStats;
};

export type ValidationOptions = {
  /** Require terminal outcomes to exist. Defaults to the publication rule set. */
  requireOutcome?: boolean;
};

/**
 * Validates a graph against the publication rules. Used by the builder's live
 * check panel and again on the server before publishing, so the client and the
 * server cannot disagree about what is publishable.
 */
export function validateGraph(
  graph: CallbookGraph,
  options: ValidationOptions = {},
): ValidationResult {
  const requireOutcome = options.requireOutcome ?? true;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const nodeIds = new Set<string>();
  let messageNodeCount = 0;
  let outcomeNodeCount = 0;
  let branchCount = 0;
  let connectedBranchCount = 0;

  if (graph.nodes.length === 0) {
    errors.push({
      code: "graph_empty",
      severity: "error",
      message: "This Callbook has no conversation steps yet. Add a message step to begin.",
    });
  }

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push({
        code: "duplicate_node_id",
        severity: "error",
        message: "Two steps share the same identifier. Delete and recreate one of them.",
        nodeId: node.id,
      });
    }
    nodeIds.add(node.id);

    if (node.type === "message") messageNodeCount += 1;
    else outcomeNodeCount += 1;

    if (node.title.trim().length === 0) {
      errors.push({
        code: "node_title_missing",
        severity: "error",
        message: "Every step needs a short title.",
        nodeId: node.id,
      });
    }

    if (node.script.trim().length === 0) {
      errors.push({
        code: "node_script_missing",
        severity: "error",
        message:
          node.type === "message"
            ? `"${displayTitle(node)}" has no script. Add what you will say.`
            : `"${displayTitle(node)}" has no closing line. Add how you will end the call.`,
        nodeId: node.id,
      });
    }

    if (node.type === "outcome") {
      if (!isOutcomeKey(node.outcomeKey)) {
        errors.push({
          code: "outcome_key_missing",
          severity: "error",
          message: `"${displayTitle(node)}" needs an outcome category.`,
          nodeId: node.id,
        });
      }
      if (node.branches.length > 0) {
        errors.push({
          code: "outcome_has_branches",
          severity: "error",
          message: `"${displayTitle(node)}" is an outcome step and cannot have prospect responses.`,
          nodeId: node.id,
        });
      }
      continue;
    }

    if (node.branches.length === 0) {
      errors.push({
        code: "node_without_branches",
        severity: "error",
        message: `"${displayTitle(node)}" has no possible prospect responses. Add at least one.`,
        nodeId: node.id,
      });
    }

    const branchIds = new Set<string>();
    for (const branch of node.branches) {
      branchCount += 1;
      if (branchIds.has(branch.id)) {
        errors.push({
          code: "duplicate_branch_id",
          severity: "error",
          message: "Two responses share the same identifier. Delete and recreate one of them.",
          nodeId: node.id,
          branchId: branch.id,
        });
      }
      branchIds.add(branch.id);

      if (branch.label.trim().length === 0) {
        errors.push({
          code: "branch_label_missing",
          severity: "error",
          message: `A response on "${displayTitle(node)}" has no label. Add a short label you can recognise during a call.`,
          nodeId: node.id,
          branchId: branch.id,
        });
      }

      if (!branch.nextNodeId) {
        errors.push({
          code: "branch_unconnected",
          severity: "error",
          message: `The response "${branch.label || "Untitled response"}" on "${displayTitle(node)}" is not connected to a next step.`,
          nodeId: node.id,
          branchId: branch.id,
        });
        continue;
      }

      if (branch.nextNodeId === node.id) {
        errors.push({
          code: "branch_self_connection",
          severity: "error",
          message: `The response "${branch.label || "Untitled response"}" on "${displayTitle(node)}" points back to its own step.`,
          nodeId: node.id,
          branchId: branch.id,
        });
        continue;
      }

      if (!findNode(graph, branch.nextNodeId)) {
        errors.push({
          code: "branch_target_missing",
          severity: "error",
          message: `The response "${branch.label || "Untitled response"}" on "${displayTitle(node)}" points to a step that no longer exists.`,
          nodeId: node.id,
          branchId: branch.id,
        });
        continue;
      }

      connectedBranchCount += 1;
    }
  }

  if (graph.nodes.length > 0) {
    if (!graph.startNodeId) {
      errors.push({
        code: "start_node_missing",
        severity: "error",
        message: "Choose the starting step. Every Callbook needs exactly one starting step.",
      });
    } else if (!findNode(graph, graph.startNodeId)) {
      errors.push({
        code: "start_node_invalid",
        severity: "error",
        message: "The starting step no longer exists. Choose a new starting step.",
      });
    }

    if (requireOutcome && outcomeNodeCount === 0) {
      errors.push({
        code: "no_outcome_nodes",
        severity: "error",
        message: "Add at least one outcome step so every conversation has a defined ending.",
      });
    }

    if (findNode(graph, graph.startNodeId)) {
      const reachable = reachableNodeIds(graph);
      for (const node of graph.nodes) {
        if (!reachable.has(node.id)) {
          warnings.push({
            code: "node_unreachable",
            severity: "warning",
            message: `"${displayTitle(node)}" cannot be reached from the starting step. Connect a response to it, or delete it.`,
            nodeId: node.id,
          });
        }
      }

      const cycleNodeIds = findCycleNodeIds(graph);
      if (cycleNodeIds.length > 0) {
        const titles = cycleNodeIds
          .map((id) => displayTitle(findNode(graph, id)))
          .filter((title): title is string => Boolean(title));
        // Loops are allowed: a real call returns to an earlier step ("how much is
        // it again?", "show me the demo once more"). Call Mode advances one step per
        // chosen response, and every traversal helper uses a visited set, so a cycle
        // cannot hang the workspace. It is surfaced as a warning so the author can
        // see where the conversation can circle and confirm each loop still has an
        // exit to an outcome step.
        warnings.push({
          code: "cycle_detected",
          severity: "warning",
          message: `These steps can loop back to an earlier step: ${titles.join(", ")}. Loops are allowed — make sure every loop still has a response that ends the call.`,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodeCount: graph.nodes.length,
      messageNodeCount,
      outcomeNodeCount,
      branchCount,
      connectedBranchCount,
    },
  };
}