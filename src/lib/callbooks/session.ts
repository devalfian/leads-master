import { z } from "zod";
import type { CallNode, CallbookGraph, SessionSnapshot, SessionStepKind } from "./types";
import { CALL_STEP_TYPES } from "./types";

/* -------------------------------------------------------------------------- */
/* Snapshot schema                                                            */
/* -------------------------------------------------------------------------- */

const positionSchema = z.object({ x: z.number(), y: z.number() });

const branchSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  examplePhrases: z.array(z.string()),
  nextNodeId: z.string().nullable(),
  sortOrder: z.number().int(),
});

const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["message", "outcome"]),
  title: z.string(),
  script: z.string(),
  internalNote: z.string().nullable(),
  position: positionSchema,
  outcomeKey: z.string().nullable(),
  branches: z.array(branchSchema),
  sortOrder: z.number().int(),
  // Phase 2 fields. Defaults keep snapshots published before these fields existed
  // readable: an old snapshot simply reports an unclassified step.
  stepType: z.enum(CALL_STEP_TYPES).nullable().default(null),
  purpose: z.string().nullable().default(null),
  talkingPoints: z.array(z.string()).default([]),
});

const snapshotSchema = z.object({
  version: z.number().int().nonnegative(),
  callbookId: z.string().min(1),
  callbookTitle: z.string(),
  capturedAt: z.string(),
  startNodeId: z.string().min(1),
  nodes: z.array(nodeSchema).min(1),
});

/* -------------------------------------------------------------------------- */
/* Snapshot creation / parsing                                                */
/* -------------------------------------------------------------------------- */

export type SnapshotSource = {
  callbookId: string;
  callbookTitle: string;
  version: number;
  capturedAt: string;
};

/**
 * Builds the immutable snapshot that a call session runs on. The caller must
 * validate the graph first; this function refuses graphs without a start node.
 */
export function createSnapshot(graph: CallbookGraph, source: SnapshotSource): SessionSnapshot {
  if (!graph.startNodeId || !graph.nodes.some((node) => node.id === graph.startNodeId)) {
    throw new Error("Cannot create a snapshot for a Callbook without a valid starting step.");
  }

  return {
    version: source.version,
    callbookId: source.callbookId,
    callbookTitle: source.callbookTitle,
    capturedAt: source.capturedAt,
    startNodeId: graph.startNodeId,
    nodes: graph.nodes.map(cloneNode),
  };
}

function cloneNode(node: CallNode): CallNode {
  return {
    id: node.id,
    type: node.type,
    title: node.title,
    script: node.script,
    internalNote: node.internalNote,
    position: { x: node.position.x, y: node.position.y },
    outcomeKey: node.outcomeKey,
    branches: node.branches.map((branch) => ({
      id: branch.id,
      label: branch.label,
      examplePhrases: [...branch.examplePhrases],
      nextNodeId: branch.nextNodeId,
      sortOrder: branch.sortOrder,
    })),
    sortOrder: node.sortOrder,
    stepType: node.stepType ?? null,
    purpose: node.purpose ?? null,
    talkingPoints: [...(node.talkingPoints ?? [])],
  };
}

/**
 * Parses a stored snapshot. Returns `null` on malformed data instead of casting,
 * so a corrupted row surfaces as an error rather than a broken call screen.
 */
export function parseSnapshot(raw: string): SessionSnapshot | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = snapshotSchema.safeParse(parsed);
  if (!result.success) return null;

  const snapshot = result.data;
  if (!snapshot.nodes.some((node) => node.id === snapshot.startNodeId)) return null;

  const nodeIds = new Set(snapshot.nodes.map((node) => node.id));
  for (const node of snapshot.nodes) {
    for (const branch of node.branches) {
      if (branch.nextNodeId !== null && !nodeIds.has(branch.nextNodeId)) return null;
    }
  }

  return snapshot;
}

export function serializeSnapshot(snapshot: SessionSnapshot): string {
  return JSON.stringify(snapshot);
}

export function snapshotGraph(snapshot: SessionSnapshot): CallbookGraph {
  return { startNodeId: snapshot.startNodeId, nodes: snapshot.nodes };
}

export function findSnapshotNode(
  snapshot: SessionSnapshot,
  nodeId: string | null,
): CallNode | null {
  if (!nodeId) return null;
  return snapshot.nodes.find((node) => node.id === nodeId) ?? null;
}

export function isTerminalNode(node: CallNode | null): boolean {
  return node?.type === "outcome";
}

export function sortedNodeBranches(node: CallNode): CallNode["branches"] {
  return [...node.branches].sort((a, b) => a.sortOrder - b.sortOrder);
}

/* -------------------------------------------------------------------------- */
/* Path folding                                                               */
/* -------------------------------------------------------------------------- */

export type SessionStepInput = {
  kind: SessionStepKind;
  fromNodeId: string | null;
  toNodeId: string | null;
};

export type FoldedPath = {
  path: string[];
  currentNodeId: string | null;
  /** How many times the route was re-selected from an earlier step. */
  divergences: number;
};

/**
 * Folds the append-only step log into the route actually taken.
 *
 * This is the single source of truth for a session's path: `call_sessions.path_json`
 * is only a cache of this fold. The rules guarantee that choosing an alternative
 * response after going back replaces the forward part of the route instead of
 * keeping stale steps around.
 */
export function foldSessionPath(
  snapshot: SessionSnapshot,
  steps: readonly SessionStepInput[],
): FoldedPath {
  const nodeIds = new Set(snapshot.nodes.map((node) => node.id));
  let path: string[] = [snapshot.startNodeId];
  let divergences = 0;

  const pushNode = (nodeId: string | null | undefined): void => {
    if (!nodeId || !nodeIds.has(nodeId)) return;
    if (path[path.length - 1] === nodeId) return;
    path = [...path, nodeId];
  };

  for (const step of steps) {
    switch (step.kind) {
      case "start":
      case "restart": {
        path = [
          step.toNodeId && nodeIds.has(step.toNodeId) ? step.toNodeId : snapshot.startNodeId,
        ];
        break;
      }
      case "back": {
        if (path.length > 1) path = path.slice(0, -1);
        break;
      }
      case "advance":
      case "unexpected": {
        if (!step.toNodeId) break;
        const position = step.fromNodeId ? path.lastIndexOf(step.fromNodeId) : -1;
        if (step.fromNodeId && position >= 0 && position < path.length - 1) {
          divergences += 1;
          path = path.slice(0, position + 1);
        }
        pushNode(step.toNodeId);
        break;
      }
      default:
        break;
    }
  }

  return {
    path,
    currentNodeId: path.length > 0 ? (path[path.length - 1] ?? null) : null,
    divergences,
  };
}

export type NavigationState = {
  path: string[];
  currentNodeId: string | null;
  canGoBack: boolean;
};

export function navigationState(
  snapshot: SessionSnapshot,
  steps: readonly SessionStepInput[],
): NavigationState {
  const { path, currentNodeId } = foldSessionPath(snapshot, steps);
  return { path, currentNodeId, canGoBack: path.length > 1 };
}