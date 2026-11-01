import { findSnapshotNode, sortedNodeBranches } from "./session";
import type { CallSessionDetail, CallSessionNote, CallSessionStep } from "./types";

/**
 * Local step changes for Call Mode when there is no connection.
 *
 * The server is still the only authority: these functions only move the view so
 * the conversation can continue. The queued request replays the same branch
 * later, and the server recomputes the path from its own step log. If the server
 * disagrees — a step was removed, the call was finished elsewhere — the sync
 * panel reports it instead of pretending the local view was saved.
 *
 * `null` means "this change cannot be shown locally", and the caller must not
 * queue it either.
 */

type Options = { now?: () => string; createId?: () => string };

function stamp(options: Options): { now: string; id: string } {
  const now = (options.now ?? (() => new Date().toISOString()))();
  const id = (options.createId ?? (() => crypto.randomUUID()))();
  return { now, id };
}

function withPath(
  session: CallSessionDetail,
  path: string[],
  now: string,
): CallSessionDetail {
  return {
    ...session,
    path,
    currentNodeId: path.length > 0 ? (path[path.length - 1] ?? null) : null,
    updatedAt: now,
  };
}

/** Follows one prepared response. */
export function applyOptimisticAdvance(
  session: CallSessionDetail,
  branchId: string,
  options: Options = {},
): CallSessionDetail | null {
  const node = findSnapshotNode(session.snapshot, session.currentNodeId);
  if (!node) return null;

  const branch = sortedNodeBranches(node).find((entry) => entry.id === branchId);
  if (!branch?.nextNodeId) return null;
  if (!findSnapshotNode(session.snapshot, branch.nextNodeId)) return null;

  const { now, id } = stamp(options);
  const step: CallSessionStep = {
    id,
    sessionId: session.id,
    kind: "advance",
    fromNodeId: node.id,
    branchId: branch.id,
    toNodeId: branch.nextNodeId,
    label: branch.label,
    responseText: null,
    sortOrder: session.steps.length,
    createdAt: now,
  };

  return { ...withPath(session, [...session.path, branch.nextNodeId], now), steps: [...session.steps, step] };
}

/** Returns to the previous step. */
export function applyOptimisticBack(
  session: CallSessionDetail,
  options: Options = {},
): CallSessionDetail | null {
  if (session.path.length <= 1) return null;

  const { now, id } = stamp(options);
  const fromNodeId = session.currentNodeId;
  const path = session.path.slice(0, -1);
  const step: CallSessionStep = {
    id,
    sessionId: session.id,
    kind: "back",
    fromNodeId,
    branchId: null,
    toNodeId: path[path.length - 1] ?? null,
    label: null,
    responseText: null,
    sortOrder: session.steps.length,
    createdAt: now,
  };

  return { ...withPath(session, path, now), steps: [...session.steps, step] };
}

/** Adds a quick note. The server assigns the real id when the note syncs. */
export function applyOptimisticNote(
  session: CallSessionDetail,
  body: string,
  options: Options = {},
): CallSessionDetail | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  const { now, id } = stamp(options);
  const note: CallSessionNote = { id, sessionId: session.id, body: trimmed, createdAt: now };
  return {
    ...session,
    quickNotes: [...session.quickNotes, note],
    updatedAt: now,
  };
}
