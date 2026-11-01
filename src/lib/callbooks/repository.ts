import { getDb, RepositoryError } from "@/lib/db";
import type { SqlStatement, SqlValue } from "@/lib/db";
import { createId, hashGraph, validateGraph, createMessageNode } from "./graph";
import type { ValidationResult } from "./graph";
import { findTemplate, instantiateTemplate } from "./templates";
import { createSnapshot, foldSessionPath, parseSnapshot, serializeSnapshot } from "./session";
import { isOutcomeKey } from "./outcomes";
import type {
  CallBranch,
  CallNode,
  CallSessionDetail,
  CallSessionNote,
  CallSessionStep,
  Callbook,
  CallbookGoal,
  CallbookGraph,
  CallbookLanguage,
  CallbookStatus,
  CallbookSummary,
  SessionStepKind,
} from "./types";
import {
  isCallNodeType,
  isCallSessionStatus,
  isCallbookGoal,
  isCallbookLanguage,
  isCallbookStatus,
  isCallStepType,
  isSessionStepKind,
} from "./types";

type Row = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/* Row guards                                                                 */
/* -------------------------------------------------------------------------- */

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function nullableStr(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function num(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function parseStringArray(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/* Graph loading                                                              */
/* -------------------------------------------------------------------------- */

function toCallNode(row: Row): CallNode | null {
  const type = row["type"];
  if (!isCallNodeType(type)) return null;
  return {
    id: str(row["id"]),
    type,
    title: str(row["title"]),
    script: str(row["script"]),
    internalNote: nullableStr(row["internal_note"]),
    position: { x: num(row["position_x"]), y: num(row["position_y"]) },
    outcomeKey: nullableStr(row["outcome_key"]),
    branches: [],
    sortOrder: num(row["sort_order"]),
    stepType: isCallStepType(row["step_type"]) ? row["step_type"] : null,
    purpose: nullableStr(row["purpose"]),
    talkingPoints: parseStringArray(row["talking_points_json"]),
  };
}

function toCallBranch(row: Row): CallBranch {
  return {
    id: str(row["id"]),
    label: str(row["label"]),
    examplePhrases: parseStringArray(row["example_phrases_json"]),
    nextNodeId: nullableStr(row["next_node_id"]),
    sortOrder: num(row["sort_order"]),
  };
}

/**
 * Loads the whole draft graph in two queries (never one query per node) and
 * attaches branches to their source node.
 */
async function loadGraph(callbookId: string): Promise<CallbookGraph> {
  const db = await getDb();
  const [nodeRows, branchRows] = await Promise.all([
    db.all<Row>(
      `SELECT id, type, title, script, internal_note, position_x, position_y,
              outcome_key, sort_order, step_type, purpose, talking_points_json
         FROM call_nodes
        WHERE callbook_id = ?
        ORDER BY sort_order ASC, created_at ASC`,
      [callbookId],
    ),
    db.all<Row>(
      `SELECT id, from_node_id, label, example_phrases_json, next_node_id, sort_order
         FROM call_branches
        WHERE callbook_id = ?
        ORDER BY sort_order ASC, created_at ASC`,
      [callbookId],
    ),
  ]);

  const nodes: CallNode[] = [];
  const byId = new Map<string, CallNode>();
  for (const row of nodeRows) {
    const node = toCallNode(row);
    if (!node) continue;
    nodes.push(node);
    byId.set(node.id, node);
  }

  for (const row of branchRows) {
    const parent = byId.get(str(row["from_node_id"]));
    if (!parent) continue;
    parent.branches.push(toCallBranch(row));
  }

  for (const node of nodes) node.branches.sort((a, b) => a.sortOrder - b.sortOrder);

  return { startNodeId: null, nodes };
}

/* -------------------------------------------------------------------------- */
/* Callbook mapping                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Shared read projection. The guide joins are LEFT JOINs so a Callbook created
 * before Phase 2 (no market/niche) returns `null` labels instead of disappearing.
 */
const CALLBOOK_SELECT = `
  SELECT c.*,
         m.code AS market_code,
         m.name AS market_name,
         nc.name AS niche_name
    FROM callbooks c
    LEFT JOIN markets m ON m.id = c.market_id
    LEFT JOIN niche_categories nc ON nc.id = c.niche_category_id
`;

function toCallbookMeta(
  row: Row,
): Omit<Callbook, "graph" | "hasUnpublishedChanges" | "hasPublishedSnapshot"> & {
  hasPublishedSnapshot: boolean;
} {
  const goal = row["primary_goal"];
  const status = row["status"];
  const language = row["language"];
  return {
    id: str(row["id"]),
    title: str(row["title"]),
    description: str(row["description"]),
    targetAudience: str(row["target_audience"]),
    primaryGoal: isCallbookGoal(goal) ? goal : "book_meeting",
    status: isCallbookStatus(status) ? status : "draft",
    startNodeId: nullableStr(row["start_node_id"]),
    publishedVersion: num(row["published_version"]),
    publishedAt: nullableStr(row["published_at"]),
    archivedAt: nullableStr(row["archived_at"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
    marketId: nullableStr(row["market_id"]),
    nicheCategoryId: nullableStr(row["niche_category_id"]),
    language: isCallbookLanguage(language) ? language : null,
    internalNotes: str(row["internal_notes"]),
    marketCode: nullableStr(row["market_code"]),
    marketName: nullableStr(row["market_name"]),
    nicheName: nullableStr(row["niche_name"]),
    hasPublishedSnapshot:
      typeof row["published_snapshot_json"] === "string" &&
      str(row["published_snapshot_json"]).length > 0,
  };
}

async function hasUnpublishedChanges(row: Row, graph: CallbookGraph): Promise<boolean> {
  const publishedHash = nullableStr(row["published_graph_hash"]);
  if (!publishedHash) return toCallbookMeta(row).hasPublishedSnapshot;
  return (await hashGraph(graph)) !== publishedHash;
}

export async function listCallbooks(): Promise<CallbookSummary[]> {
  const db = await getDb();
  const rows = await db.all<Row>(
    `SELECT c.*,
            m.code AS market_code,
            m.name AS market_name,
            nc.name AS niche_name,
            (SELECT COUNT(*) FROM call_nodes n WHERE n.callbook_id = c.id) AS node_count,
            (SELECT COUNT(*) FROM call_branches b WHERE b.callbook_id = c.id) AS branch_count,
            (SELECT COUNT(*) FROM call_sessions s
              WHERE s.callbook_id = c.id AND s.status = 'completed') AS completed_sessions
       FROM callbooks c
       LEFT JOIN markets m ON m.id = c.market_id
       LEFT JOIN niche_categories nc ON nc.id = c.niche_category_id
      ORDER BY c.updated_at DESC`,
    [],
  );

  return Promise.all(
    rows.map(async (row) => {
      const base = toCallbookMeta(row);
      const graph = await loadGraph(base.id);
      return {
        ...base,
        startNodeId: base.startNodeId,
        nodeCount: num(row["node_count"]),
        branchCount: num(row["branch_count"]),
        completedSessionCount: num(row["completed_sessions"]),
        hasUnpublishedChanges: await hasUnpublishedChanges(row, graph),
      } satisfies CallbookSummary;
    }),
  );
}

export async function getCallbook(id: string): Promise<Callbook | null> {
  const db = await getDb();
  const row = await db.first<Row>(`${CALLBOOK_SELECT} WHERE c.id = ?`, [id]);
  if (!row) return null;

  const graph = await loadGraph(id);
  graph.startNodeId = nullableStr(row["start_node_id"]);

  return {
    ...toCallbookMeta(row),
    graph,
    hasUnpublishedChanges: await hasUnpublishedChanges(row, graph),
  };
}

/* -------------------------------------------------------------------------- */
/* Write helpers                                                              */
/* -------------------------------------------------------------------------- */

export type CallbookContextInput = {
  marketId?: string | null;
  nicheCategoryId?: string | null;
  language?: CallbookLanguage | null;
  internalNotes?: string;
};

/**
 * Validates a Callbook's market/niche references against the Phase 1 guide data.
 *
 * The pair must exist and belong together, so a callbook can never carry a niche
 * from a different market. Both are optional: a callbook created before Phase 2
 * simply has `null` references and keeps working.
 */
async function resolveGuideContext(
  marketId: string | null,
  nicheCategoryId: string | null,
): Promise<{ marketId: string | null; nicheCategoryId: string | null }> {
  if (!marketId && !nicheCategoryId) return { marketId: null, nicheCategoryId: null };
  if (!marketId) {
    throw new RepositoryError("invalid_reference", "Choose a market before choosing a niche.");
  }

  const db = await getDb();
  const market = await db.first<Row>("SELECT id FROM markets WHERE id = ?", [marketId]);
  if (!market) {
    throw new RepositoryError("invalid_reference", "That market no longer exists.");
  }
  if (!nicheCategoryId) return { marketId, nicheCategoryId: null };

  const niche = await db.first<Row>(
    "SELECT id, market_id FROM niche_categories WHERE id = ?",
    [nicheCategoryId],
  );
  if (!niche) {
    throw new RepositoryError("invalid_reference", "That niche no longer exists.");
  }
  if (str(niche["market_id"]) !== marketId) {
    throw new RepositoryError("invalid_reference", "That niche belongs to a different market.");
  }
  return { marketId, nicheCategoryId };
}

export type CreateCallbookInput = CallbookContextInput & {
  title: string;
  description?: string;
  targetAudience?: string;
  primaryGoal: CallbookGoal;
  templateId?: string | null;
};

function nodeInsertStatements(
  callbookId: string,
  nodes: readonly CallNode[],
  now: string,
): SqlStatement[] {
  return nodes.map((node, index) => ({
    sql: `INSERT INTO call_nodes
            (id, callbook_id, type, title, script, internal_note, position_x, position_y,
             outcome_key, sort_order, step_type, purpose, talking_points_json,
             created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      node.id,
      callbookId,
      node.type,
      node.title,
      node.script,
      node.internalNote,
      node.position.x,
      node.position.y,
      node.type === "outcome" ? node.outcomeKey : null,
      index,
      node.stepType ?? null,
      node.purpose ?? null,
      JSON.stringify(node.talkingPoints ?? []),
      now,
      now,
    ],
  }));
}

function branchInsertStatements(
  callbookId: string,
  nodes: readonly CallNode[],
  now: string,
): SqlStatement[] {
  const statements: SqlStatement[] = [];
  for (const node of nodes) {
    const ordered = [...node.branches].sort((a, b) => a.sortOrder - b.sortOrder);
    ordered.forEach((branch, index) => {
      statements.push({
        sql: `INSERT INTO call_branches
                (id, callbook_id, from_node_id, label, example_phrases_json, next_node_id,
                 sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          branch.id,
          callbookId,
          node.id,
          branch.label,
          JSON.stringify(branch.examplePhrases),
          branch.nextNodeId,
          index,
          now,
          now,
        ],
      });
    });
  }
  return statements;
}

export async function createCallbook(input: CreateCallbookInput): Promise<Callbook> {
  const db = await getDb();
  const title = input.title.trim();
  if (!title) {
    throw new RepositoryError("title_required", "Give your Callbook a name.");
  }

  const now = nowIso();
  const id = createId();
  let graph: CallbookGraph;
  let description = (input.description ?? "").trim();
  let targetAudience = (input.targetAudience ?? "").trim();

  if (input.templateId) {
    const template = findTemplate(input.templateId);
    if (!template) {
      throw new RepositoryError("template_not_found", "That template is no longer available.");
    }
    const instantiated = instantiateTemplate(template);
    graph = instantiated.graph;
    description = description || instantiated.description;
    targetAudience = targetAudience || instantiated.targetAudience;
  } else {
    const opening = { ...createMessageNode({ startNodeId: null, nodes: [] }), title: "Opening" };
    graph = { startNodeId: opening.id, nodes: [opening] };
  }

  const context = await resolveGuideContext(
    input.marketId ?? null,
    input.nicheCategoryId ?? null,
  );

  await db.batch([
    {
      sql: `INSERT INTO callbooks
              (id, title, description, target_audience, primary_goal, status, start_node_id,
               published_version, market_id, niche_category_id, language, internal_notes,
               created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'draft', ?, 0, ?, ?, ?, ?, ?, ?)`,
      params: [
        id,
        title,
        description,
        targetAudience,
        input.primaryGoal,
        graph.startNodeId,
        context.marketId,
        context.nicheCategoryId,
        input.language ?? null,
        (input.internalNotes ?? "").trim(),
        now,
        now,
      ],
    },
    ...nodeInsertStatements(id, graph.nodes, now),
    ...branchInsertStatements(id, graph.nodes, now),
  ]);

  const created = await getCallbook(id);
  if (!created) {
    throw new RepositoryError("create_failed", "The Callbook could not be read back after saving.");
  }
  return created;
}

export type CallbookMetaPatch = CallbookContextInput & {
  title?: string;
  description?: string;
  targetAudience?: string;
  primaryGoal?: CallbookGoal;
};

export async function updateCallbookMeta(
  id: string,
  patch: CallbookMetaPatch,
): Promise<Callbook> {
  const db = await getDb();
  const existing = await db.first<Row>("SELECT * FROM callbooks WHERE id = ?", [id]);
  if (!existing) throw new RepositoryError("not_found", "That Callbook no longer exists.");
  if (str(existing["status"]) === "archived") {
    throw new RepositoryError("archived", "Restore this Callbook before editing it.");
  }

  const assignments: string[] = [];
  const params: SqlValue[] = [];

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) throw new RepositoryError("title_required", "Give your Callbook a name.");
    assignments.push("title = ?");
    params.push(title);
  }
  if (patch.description !== undefined) {
    assignments.push("description = ?");
    params.push(patch.description.trim());
  }
  if (patch.targetAudience !== undefined) {
    assignments.push("target_audience = ?");
    params.push(patch.targetAudience.trim());
  }
  if (patch.primaryGoal !== undefined) {
    assignments.push("primary_goal = ?");
    params.push(patch.primaryGoal);
  }

  // Market / niche are written together so the pair can never drift apart.
  if (patch.marketId !== undefined || patch.nicheCategoryId !== undefined) {
    const currentMarket = nullableStr(existing["market_id"]);
    const currentNiche = nullableStr(existing["niche_category_id"]);

    const nextMarket = patch.marketId !== undefined ? patch.marketId : currentMarket;
    let nextNiche = patch.nicheCategoryId !== undefined ? patch.nicheCategoryId : currentNiche;
    // Switching market without naming a niche clears the stale niche.
    if (patch.marketId !== undefined && patch.nicheCategoryId === undefined) nextNiche = null;

    const resolved = await resolveGuideContext(nextMarket, nextNiche);
    assignments.push("market_id = ?", "niche_category_id = ?");
    params.push(resolved.marketId, resolved.nicheCategoryId);
  }

  if (patch.language !== undefined) {
    assignments.push("language = ?");
    params.push(patch.language);
  }

  if (patch.internalNotes !== undefined) {
    assignments.push("internal_notes = ?");
    params.push(patch.internalNotes.trim());
  }

  if (assignments.length > 0) {
    assignments.push("updated_at = ?");
    params.push(nowIso(), id);
    await db.run(`UPDATE callbooks SET ${assignments.join(", ")} WHERE id = ?`, params);
  }

  const updated = await getCallbook(id);
  if (!updated) throw new RepositoryError("not_found", "That Callbook no longer exists.");
  return updated;
}

/* -------------------------------------------------------------------------- */
/* Graph persistence                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Normalises a graph coming from the client: array order becomes sort order and
 * positions are rounded. Node and branch ids are never rewritten, so editing
 * keeps stable identity.
 */
function normalizeGraph(graph: CallbookGraph): CallbookGraph {
  return {
    startNodeId: graph.startNodeId,
    nodes: graph.nodes.map((node, nodeIndex) => ({
      ...node,
      sortOrder: nodeIndex,
      position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      branches: node.branches.map((branch, branchIndex) => ({
        ...branch,
        sortOrder: branchIndex,
        examplePhrases: branch.examplePhrases.map((phrase) => phrase.trim()).filter(Boolean),
      })),
    })),
  };
}

/**
 * Saves the entire draft graph atomically.
 *
 * Order inside the transaction matters: branches are removed first (so no branch
 * can reference a node being deleted), then nodes that are no longer part of the
 * graph, then upserts, then the new branches. If any statement fails the whole
 * batch rolls back and the previous draft stays intact.
 */
export async function saveCallbookGraph(
  id: string,
  incomingGraph: CallbookGraph,
): Promise<{ callbook: Callbook; validation: ValidationResult }> {
  const db = await getDb();
  const existing = await db.first<Row>("SELECT id, status FROM callbooks WHERE id = ?", [id]);
  if (!existing) throw new RepositoryError("not_found", "That Callbook no longer exists.");
  if (str(existing["status"]) === "archived") {
    throw new RepositoryError("archived", "Restore this Callbook before editing it.");
  }

  const graph = normalizeGraph(incomingGraph);
  const keepIds = graph.nodes.map((node) => node.id);
  const now = nowIso();

  const statements: SqlStatement[] = [
    { sql: "DELETE FROM call_branches WHERE callbook_id = ?", params: [id] },
    {
      sql: `DELETE FROM call_nodes
             WHERE callbook_id = ?
               AND id NOT IN (SELECT value FROM json_each(?))`,
      params: [id, JSON.stringify(keepIds)],
    },
  ];

  for (const node of graph.nodes) {
    statements.push({
      sql: `INSERT INTO call_nodes
              (id, callbook_id, type, title, script, internal_note, position_x, position_y,
               outcome_key, sort_order, step_type, purpose, talking_points_json,
               created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              type = excluded.type,
              title = excluded.title,
              script = excluded.script,
              internal_note = excluded.internal_note,
              position_x = excluded.position_x,
              position_y = excluded.position_y,
              outcome_key = excluded.outcome_key,
              sort_order = excluded.sort_order,
              step_type = excluded.step_type,
              purpose = excluded.purpose,
              talking_points_json = excluded.talking_points_json,
              updated_at = excluded.updated_at`,
      params: [
        node.id,
        id,
        node.type,
        node.title,
        node.script,
        node.internalNote,
        node.position.x,
        node.position.y,
        node.type === "outcome" ? node.outcomeKey : null,
        node.sortOrder,
        node.stepType ?? null,
        node.purpose ?? null,
        JSON.stringify(node.talkingPoints ?? []),
        now,
        now,
      ],
    });
  }

  statements.push(...branchInsertStatements(id, graph.nodes, now));
  statements.push({
    sql: "UPDATE callbooks SET start_node_id = ?, updated_at = ? WHERE id = ?",
    params: [graph.startNodeId, now, id],
  });

  await db.batch(statements);

  const saved = await getCallbook(id);
  if (!saved) throw new RepositoryError("not_found", "That Callbook no longer exists.");
  return { callbook: saved, validation: validateGraph(saved.graph) };
}

/* -------------------------------------------------------------------------- */
/* Publication                                                                */
/* -------------------------------------------------------------------------- */

export type PublishResult = {
  callbook: Callbook;
  version: number;
  publishedAt: string;
  warnings: ValidationResult["warnings"];
};

/**
 * Publishes the current draft as an immutable snapshot.
 *
 * The draft graph is validated first: an invalid graph is never published. The
 * version bump is guarded with `WHERE published_version = ?` so two publishes
 * cannot interleave into an inconsistent snapshot/version pair.
 */
export async function publishCallbook(id: string): Promise<PublishResult> {
  const db = await getDb();
  const callbook = await getCallbook(id);
  if (!callbook) throw new RepositoryError("not_found", "That Callbook no longer exists.");
  if (callbook.status === "archived") {
    throw new RepositoryError("archived", "Restore this Callbook before publishing it.");
  }

  const validation = validateGraph(callbook.graph);
  if (!validation.ok) {
    throw new RepositoryError(
      "invalid_graph",
      "This Callbook cannot be published until its checks are resolved.",
    );
  }

  const publishedAt = nowIso();
  const version = callbook.publishedVersion + 1;
  const snapshot = createSnapshot(callbook.graph, {
    callbookId: callbook.id,
    callbookTitle: callbook.title,
    version,
    capturedAt: publishedAt,
  });
  const graphHash = await hashGraph(callbook.graph);

  const guard = await db.first<Row>("SELECT published_version FROM callbooks WHERE id = ?", [id]);
  if (!guard || num(guard["published_version"]) !== callbook.publishedVersion) {
    throw new RepositoryError(
      "conflict",
      "This Callbook was published a moment ago. Reload the page and try again.",
    );
  }

  await db.run(
    `UPDATE callbooks
        SET status = 'published',
            published_version = ?,
            published_snapshot_json = ?,
            published_graph_hash = ?,
            published_at = ?,
            archived_at = NULL,
            updated_at = ?
      WHERE id = ? AND published_version = ?`,
    [
      version,
      serializeSnapshot(snapshot),
      graphHash,
      publishedAt,
      publishedAt,
      id,
      callbook.publishedVersion,
    ],
  );

  const published = await getCallbook(id);
  if (!published) throw new RepositoryError("not_found", "That Callbook no longer exists.");

  return { callbook: published, version, publishedAt, warnings: validation.warnings };
}

/* -------------------------------------------------------------------------- */
/* Duplicate / archive                                                        */
/* -------------------------------------------------------------------------- */

export async function duplicateCallbook(id: string): Promise<Callbook> {
  const db = await getDb();
  const source = await getCallbook(id);
  if (!source) throw new RepositoryError("not_found", "That Callbook no longer exists.");

  const newId = createId();
  const now = nowIso();
  const title = `${source.title} (copy)`.slice(0, 120);

  // Fresh ids for every node so the copy is fully independent.
  const idMap = new Map<string, string>();
  for (const node of source.graph.nodes) idMap.set(node.id, createId());

  const nodes: CallNode[] = source.graph.nodes.map((node) => ({
    ...node,
    id: idMap.get(node.id) ?? createId(),
    branches: node.branches.map((branch) => ({
      ...branch,
      id: createId(),
      nextNodeId: branch.nextNodeId ? (idMap.get(branch.nextNodeId) ?? null) : null,
    })),
  }));

  const startNodeId = source.graph.startNodeId
    ? (idMap.get(source.graph.startNodeId) ?? null)
    : null;

  await db.batch([
    {
      sql: `INSERT INTO callbooks
              (id, title, description, target_audience, primary_goal, status, start_node_id,
               published_version, market_id, niche_category_id, language, internal_notes,
               created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'draft', ?, 0, ?, ?, ?, ?, ?, ?)`,
      params: [
        newId,
        title,
        source.description,
        source.targetAudience,
        source.primaryGoal,
        startNodeId,
        source.marketId,
        source.nicheCategoryId,
        source.language,
        source.internalNotes,
        now,
        now,
      ],
    },
    ...nodeInsertStatements(newId, nodes, now),
    ...branchInsertStatements(newId, nodes, now),
  ]);

  const copy = await getCallbook(newId);
  if (!copy) throw new RepositoryError("duplicate_failed", "The copy could not be saved.");
  return copy;
}

export async function setCallbookArchived(id: string, archived: boolean): Promise<Callbook> {
  const db = await getDb();
  const row = await db.first<Row>(
    "SELECT id, status, published_version FROM callbooks WHERE id = ?",
    [id],
  );
  if (!row) throw new RepositoryError("not_found", "That Callbook no longer exists.");

  const now = nowIso();
  if (archived) {
    await db.run(
      "UPDATE callbooks SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?",
      [now, now, id],
    );
  } else {
    const restoreStatus: CallbookStatus =
      num(row["published_version"]) > 0 ? "published" : "draft";
    await db.run(
      "UPDATE callbooks SET status = ?, archived_at = NULL, updated_at = ? WHERE id = ?",
      [restoreStatus, now, id],
    );
  }

  const updated = await getCallbook(id);
  if (!updated) throw new RepositoryError("not_found", "That Callbook no longer exists.");
  return updated;
}

/* -------------------------------------------------------------------------- */
/* Call sessions                                                              */
/* -------------------------------------------------------------------------- */

function toSessionStep(row: Row): CallSessionStep | null {
  const kind = row["kind"];
  if (!isSessionStepKind(kind)) return null;
  return {
    id: str(row["id"]),
    sessionId: str(row["session_id"]),
    kind,
    fromNodeId: nullableStr(row["from_node_id"]),
    branchId: nullableStr(row["branch_id"]),
    toNodeId: nullableStr(row["to_node_id"]),
    label: nullableStr(row["label"]),
    responseText: nullableStr(row["response_text"]),
    sortOrder: num(row["sort_order"]),
    createdAt: str(row["created_at"]),
  };
}

function toSessionNote(row: Row): CallSessionNote {
  return {
    id: str(row["id"]),
    sessionId: str(row["session_id"]),
    body: str(row["body"]),
    createdAt: str(row["created_at"]),
  };
}

function toSessionBase(row: Row) {
  const status = row["status"];
  if (!isCallSessionStatus(status)) {
    throw new RepositoryError("corrupt_session", "This call session has an unrecognised status.");
  }
  return {
    id: str(row["id"]),
    callbookId: str(row["callbook_id"]),
    callbookTitle: str(row["callbook_title"]),
    publishedVersion: num(row["published_version"]),
    prospectName: nullableStr(row["prospect_name"]),
    leadId: nullableStr(row["lead_id"]),
    status,
    currentNodeId: nullableStr(row["current_node_id"]),
    path: [] as string[],
    notes: str(row["notes"]),
    outcomeKey: nullableStr(row["outcome_key"]),
    nextAction: nullableStr(row["next_action"]),
    followUpAt: nullableStr(row["follow_up_at"]),
    startedAt: str(row["started_at"]),
    endedAt: nullableStr(row["ended_at"]),
    createdAt: str(row["created_at"]),
    updatedAt: str(row["updated_at"]),
  };
}

async function loadSessionDetail(sessionId: string): Promise<CallSessionDetail | null> {
  const db = await getDb();
  const row = await db.first<Row>("SELECT * FROM call_sessions WHERE id = ?", [sessionId]);
  if (!row) return null;

  const snapshot = parseSnapshot(str(row["snapshot_json"]));
  if (!snapshot) {
    throw new RepositoryError(
      "corrupt_snapshot",
      "The published conversation for this call could not be read. Start a new call from the Callbook.",
    );
  }

  const [stepRows, noteRows] = await Promise.all([
    db.all<Row>(
      `SELECT id, session_id, kind, from_node_id, branch_id, to_node_id, label, response_text,
              sort_order, created_at
         FROM call_session_steps
        WHERE session_id = ?
        ORDER BY sort_order ASC, created_at ASC`,
      [sessionId],
    ),
    db.all<Row>(
      `SELECT id, session_id, body, created_at
         FROM call_session_notes
        WHERE session_id = ?
        ORDER BY created_at ASC`,
      [sessionId],
    ),
  ]);

  const steps = stepRows
    .map(toSessionStep)
    .filter((step): step is CallSessionStep => step !== null);

  const folded = foldSessionPath(snapshot, steps);

  return {
    ...toSessionBase(row),
    currentNodeId: folded.currentNodeId,
    path: folded.path,
    snapshot,
    steps,
    quickNotes: noteRows.map(toSessionNote),
  };
}

export async function getCallSession(sessionId: string): Promise<CallSessionDetail | null> {
  return loadSessionDetail(sessionId);
}

export type CallSessionListItem = ReturnType<typeof toSessionBase> & {
  stepCount: number;
};

export async function listCallSessions(limit = 100): Promise<CallSessionListItem[]> {
  const db = await getDb();
  const cap = Math.min(Math.max(limit, 1), 200);
  const rows = await db.all<Row>(
    `SELECT s.*,
            (SELECT COUNT(*) FROM call_session_steps st WHERE st.session_id = s.id) AS step_count
       FROM call_sessions s
      ORDER BY s.started_at DESC
      LIMIT ?`,
    [cap],
  );

  return rows.map((row) => ({ ...toSessionBase(row), stepCount: num(row["step_count"]) }));
}

function pathUpdateStatement(
  sessionId: string,
  currentNodeId: string | null,
  path: readonly string[],
  now: string,
): SqlStatement {
  return {
    sql: "UPDATE call_sessions SET current_node_id = ?, path_json = ?, updated_at = ? WHERE id = ?",
    params: [currentNodeId, JSON.stringify(path), now, sessionId],
  };
}

function stepInsertStatement(
  sessionId: string,
  step: {
    kind: SessionStepKind;
    fromNodeId: string | null;
    branchId: string | null;
    toNodeId: string | null;
    label: string | null;
    responseText: string | null;
  },
  sortOrder: number,
  now: string,
): SqlStatement {
  return {
    sql: `INSERT INTO call_session_steps
            (id, session_id, kind, from_node_id, branch_id, to_node_id, label, response_text,
             sort_order, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [
      createId(),
      sessionId,
      step.kind,
      step.fromNodeId,
      step.branchId,
      step.toNodeId,
      step.label,
      step.responseText,
      sortOrder,
      now,
    ],
  };
}

async function requireActiveSession(sessionId: string): Promise<CallSessionDetail> {
  const session = await loadSessionDetail(sessionId);
  if (!session) throw new RepositoryError("not_found", "That call session no longer exists.");
  if (session.status !== "in_progress") {
    throw new RepositoryError(
      "session_finished",
      "This call has already been completed. Start a new call to continue.",
    );
  }
  return session;
}

/* -------------------------------------------------------------------------- */
/* Start a session                                                            */
/* -------------------------------------------------------------------------- */

export async function startCallSession(
  callbookId: string,
  options: { prospectName?: string | null; leadId?: string | null } = {},
): Promise<CallSessionDetail> {
  const db = await getDb();
  const callbookRow = await db.first<Row>("SELECT * FROM callbooks WHERE id = ?", [callbookId]);
  if (!callbookRow) throw new RepositoryError("not_found", "That Callbook no longer exists.");

  if (str(callbookRow["status"]) === "archived") {
    throw new RepositoryError(
      "archived",
      "This Callbook is archived. Restore it before starting a new call.",
    );
  }

  const version = num(callbookRow["published_version"]);
  const snapshotRaw = str(callbookRow["published_snapshot_json"]);
  if (version < 1 || !snapshotRaw) {
    throw new RepositoryError(
      "not_published",
      "Publish this Callbook before starting a call — calls always use a published version.",
    );
  }

  const stored = parseSnapshot(snapshotRaw);
  if (!stored) {
    throw new RepositoryError(
      "corrupt_snapshot",
      "The published version of this Callbook could not be read. Publish it again.",
    );
  }
  if (stored.version !== version) {
    throw new RepositoryError(
      "corrupt_snapshot",
      "The published version of this Callbook does not match its version number. Publish it again.",
    );
  }

  const now = nowIso();
  const sessionId = createId();
  let prospectName = (options.prospectName ?? "").trim();
  const path = [stored.startNodeId];

  // Optional lead context: the call may be started from a lead record. The name is
  // snapshotted into `prospect_name`, so Call History keeps showing the business as
  // it was called even if the lead is renamed later.
  const leadId = options.leadId ?? null;
  if (leadId) {
    const lead = await db.first<Row>(
      "SELECT id, business_name, market_id FROM leads WHERE id = ?",
      [leadId],
    );
    if (!lead) {
      throw new RepositoryError("not_found", "That lead no longer exists.");
    }
    const callbookMarket = nullableStr(callbookRow["market_id"]);
    if (callbookMarket && callbookMarket !== str(lead["market_id"])) {
      throw new RepositoryError(
        "invalid_reference",
        "That lead belongs to a different market than this Callbook.",
      );
    }
    if (!prospectName) prospectName = str(lead["business_name"]);
  }

  await db.batch([
    {
      sql: `INSERT INTO call_sessions
              (id, callbook_id, callbook_title, published_version, snapshot_json, prospect_name,
               status, current_node_id, path_json, notes, lead_id, started_at, created_at,
               updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, '', ?, ?, ?, ?)`,
      params: [
        sessionId,
        callbookId,
        str(callbookRow["title"]),
        version,
        serializeSnapshot(stored),
        prospectName.length > 0 ? prospectName : null,
        stored.startNodeId,
        JSON.stringify(path),
        leadId,
        now,
        now,
        now,
      ],
    },
    stepInsertStatement(
      sessionId,
      {
        kind: "start",
        fromNodeId: null,
        branchId: null,
        toNodeId: stored.startNodeId,
        label: "Call started",
        responseText: null,
      },
      0,
      now,
    ),
  ]);

  const created = await loadSessionDetail(sessionId);
  if (!created) throw new RepositoryError("not_found", "The call session could not be read back.");
  return created;
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function resolveSessionBranch(
  session: CallSessionDetail,
  branchId: string,
): { branch: CallBranch; nextNodeId: string; currentNodeId: string } {
  const currentNodeId = session.currentNodeId;
  if (!currentNodeId) {
    throw new RepositoryError("no_current_step", "This call has no current step. Restart the call.");
  }
  const node = session.snapshot.nodes.find((candidate) => candidate.id === currentNodeId);
  if (!node) {
    throw new RepositoryError("no_current_step", "This call's current step is missing.");
  }
  const branch = node.branches.find((candidate) => candidate.id === branchId);
  if (!branch) {
    throw new RepositoryError(
      "branch_not_found",
      "That response does not belong to the current step. Choose one of the responses shown.",
    );
  }
  if (!branch.nextNodeId) {
    throw new RepositoryError("branch_unconnected", "That response has no next step.");
  }
  if (!session.snapshot.nodes.some((candidate) => candidate.id === branch.nextNodeId)) {
    throw new RepositoryError(
      "target_missing",
      "That response points to a step that is not available.",
    );
  }
  return { branch, nextNodeId: branch.nextNodeId, currentNodeId };
}

/**
 * Records the selection of a prospect response and advances the call.
 * The transition is persisted before the client is told to move on.
 */
export async function advanceCallSession(
  sessionId: string,
  input: { branchId: string; responseText?: string | null },
): Promise<CallSessionDetail> {
  const db = await getDb();
  const session = await requireActiveSession(sessionId);
  const { branch, nextNodeId, currentNodeId } = resolveSessionBranch(session, input.branchId);

  const now = nowIso();
  const responseText = (input.responseText ?? "").trim();
  const step = {
    kind: "advance" as const,
    fromNodeId: currentNodeId,
    branchId: branch.id,
    toNodeId: nextNodeId,
    label: branch.label,
    responseText: responseText.length > 0 ? responseText.slice(0, 500) : null,
  };

  const folded = foldSessionPath(session.snapshot, [
    ...session.steps,
    { kind: step.kind, fromNodeId: step.fromNodeId, toNodeId: step.toNodeId },
  ]);

  await db.batch([
    stepInsertStatement(sessionId, step, session.steps.length, now),
    pathUpdateStatement(sessionId, folded.currentNodeId, folded.path, now),
  ]);

  const updated = await loadSessionDetail(sessionId);
  if (!updated) throw new RepositoryError("not_found", "That call session no longer exists.");
  return updated;
}

/**
 * Steps back to the previous node of the route actually taken. The stored log
 * gets a `back` event, so a later alternative response naturally replaces the
 * abandoned forward path when the log is folded.
 */
export async function goBackInCallSession(sessionId: string): Promise<CallSessionDetail> {
  const db = await getDb();
  const session = await requireActiveSession(sessionId);

  if (session.path.length <= 1) {
    throw new RepositoryError("at_start", "You are already at the first step of this call.");
  }

  const currentNodeId = session.path[session.path.length - 1] ?? null;
  const previousNodeId = session.path[session.path.length - 2] ?? null;
  const now = nowIso();

  const folded = foldSessionPath(session.snapshot, [
    ...session.steps,
    { kind: "back", fromNodeId: currentNodeId, toNodeId: null },
  ]);

  await db.batch([
    stepInsertStatement(
      sessionId,
      {
        kind: "back",
        fromNodeId: currentNodeId,
        branchId: null,
        toNodeId: previousNodeId,
        label: "Back",
        responseText: null,
      },
      session.steps.length,
      now,
    ),
    pathUpdateStatement(sessionId, folded.currentNodeId, folded.path, now),
  ]);

  const updated = await loadSessionDetail(sessionId);
  if (!updated) throw new RepositoryError("not_found", "That call session no longer exists.");
  return updated;
}

/* -------------------------------------------------------------------------- */
/* Notes and unexpected responses                                             */
/* -------------------------------------------------------------------------- */

export async function addSessionNote(
  sessionId: string,
  body: string,
): Promise<{ note: CallSessionNote; session: CallSessionDetail }> {
  const db = await getDb();
  const trimmed = body.trim();
  if (!trimmed) throw new RepositoryError("empty_note", "Write something before saving the note.");
  if (trimmed.length > 2000) {
    throw new RepositoryError("note_too_long", "Keep notes under 2000 characters.");
  }

  const session = await requireActiveSession(sessionId);
  const now = nowIso();
  const note: CallSessionNote = { id: createId(), sessionId, body: trimmed, createdAt: now };

  await db.batch([
    {
      sql: "INSERT INTO call_session_notes (id, session_id, body, created_at) VALUES (?, ?, ?, ?)",
      params: [note.id, sessionId, note.body, now],
    },
    { sql: "UPDATE call_sessions SET updated_at = ? WHERE id = ?", params: [now, sessionId] },
  ]);

  const updated = await loadSessionDetail(session.id);
  if (!updated) throw new RepositoryError("not_found", "That call session no longer exists.");
  return { note, session: updated };
}

export type UnexpectedResponseInput = {
  responseText: string;
  note?: string | null;
  /** The branch the user decided matches after hearing the answer, if any. */
  branchId?: string | null;
};

/**
 * Records what the prospect actually said. The user stays on the current step
 * unless they explicitly pick a matching response, and the Callbook itself is
 * never modified during a call.
 */
export async function recordUnexpectedResponse(
  sessionId: string,
  input: UnexpectedResponseInput,
): Promise<CallSessionDetail> {
  const db = await getDb();
  const session = await requireActiveSession(sessionId);

  const responseText = input.responseText.trim();
  if (!responseText) {
    throw new RepositoryError("empty_response", "Record what the prospect said first.");
  }

  const now = nowIso();
  const statements: SqlStatement[] = [];
  let toNodeId: string | null = null;
  let branchId: string | null = null;
  let label = "Unexpected response";

  if (input.branchId) {
    const resolved = resolveSessionBranch(session, input.branchId);
    toNodeId = resolved.nextNodeId;
    branchId = resolved.branch.id;
    label = `${resolved.branch.label} (unexpected)`;
  }

  statements.push(
    stepInsertStatement(
      sessionId,
      {
        kind: "unexpected",
        fromNodeId: session.currentNodeId,
        branchId,
        toNodeId,
        label,
        responseText: responseText.slice(0, 500),
      },
      session.steps.length,
      now,
    ),
  );

  const folded = foldSessionPath(session.snapshot, [
    ...session.steps,
    { kind: "unexpected", fromNodeId: session.currentNodeId, toNodeId },
  ]);
  statements.push(pathUpdateStatement(sessionId, folded.currentNodeId, folded.path, now));

  const note = (input.note ?? "").trim();
  if (note.length > 0) {
    statements.push({
      sql: "INSERT INTO call_session_notes (id, session_id, body, created_at) VALUES (?, ?, ?, ?)",
      params: [createId(), sessionId, note.slice(0, 2000), now],
    });
  }

  await db.batch(statements);

  const updated = await loadSessionDetail(sessionId);
  if (!updated) throw new RepositoryError("not_found", "That call session no longer exists.");
  return updated;
}

/* -------------------------------------------------------------------------- */
/* Finish a call                                                              */
/* -------------------------------------------------------------------------- */

export type FinishSessionInput = {
  outcomeKey: string;
  notes?: string;
  nextAction?: string | null;
  followUpAt?: string | null;
};

export async function finishCallSession(
  sessionId: string,
  input: FinishSessionInput,
): Promise<CallSessionDetail> {
  const db = await getDb();

  if (!isOutcomeKey(input.outcomeKey)) {
    throw new RepositoryError("invalid_outcome", "Choose a result for this call.");
  }

  const notes = (input.notes ?? "").trim();
  if (notes.length > 8000) {
    throw new RepositoryError("notes_too_long", "Keep the call notes under 8000 characters.");
  }

  const nextAction = (input.nextAction ?? "").trim();
  if (nextAction.length > 200) {
    throw new RepositoryError("next_action_too_long", "Keep the next action under 200 characters.");
  }

  let followUpAt: string | null = null;
  if (input.followUpAt) {
    const parsed = new Date(input.followUpAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new RepositoryError("invalid_follow_up", "That follow-up date is not valid.");
    }
    followUpAt = parsed.toISOString();
  }

  const session = await requireActiveSession(sessionId);
  const now = nowIso();

  await db.run(
    `UPDATE call_sessions
        SET status = 'completed',
            outcome_key = ?,
            notes = ?,
            next_action = ?,
            follow_up_at = ?,
            ended_at = ?,
            updated_at = ?
      WHERE id = ? AND status = 'in_progress'`,
    [input.outcomeKey, notes, nextAction || null, followUpAt, now, now, sessionId],
  );

  const updated = await loadSessionDetail(session.id);
  if (!updated) throw new RepositoryError("not_found", "That call session no longer exists.");
  if (updated.status !== "completed") {
    throw new RepositoryError(
      "finish_failed",
      "The call result could not be saved. Try again — nothing was lost.",
    );
  }
  return updated;
}