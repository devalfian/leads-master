import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Integration coverage for the development-only SQLite driver and the D1 schema:
 * migrations must apply, batches must be atomic, and foreign keys must be enforced.
 */
const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-test-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "test.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("./local-sqlite");
type Executor = Awaited<ReturnType<typeof createLocalSqliteExecutor>>;

let db: Executor;
let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  db = await createLocalSqliteExecutor();
});

afterAll(async () => {
  // Close the handle first: Windows keeps the WAL/SHM files locked while open.
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

describe("local SQLite driver", () => {
  it("applies every migration and creates the schema", async () => {
    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const names = tables.map((row) => row.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "callbooks",
        "call_nodes",
        "call_branches",
        "call_sessions",
        "call_session_steps",
        "call_session_notes",
        "_local_migrations",
      ]),
    );
  });

  it("round-trips parameterised inserts and reads", async () => {
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO callbooks (id, title, description, target_audience, primary_goal, status,
                              start_node_id, published_version, created_at, updated_at)
       VALUES (?, ?, '', ?, ?, 'draft', NULL, 0, ?, ?)`,
      ["cb-1", "Contractor outreach", "Australian trades", "book_meeting", now, now],
    );

    const row = await db.first<{ title: string; primary_goal: string }>(
      "SELECT title, primary_goal FROM callbooks WHERE id = ?",
      ["cb-1"],
    );
    expect(row).toEqual({ title: "Contractor outreach", primary_goal: "book_meeting" });

    // A quoted value must be stored verbatim, never interpreted as SQL.
    await db.run("UPDATE callbooks SET title = ? WHERE id = ?", ["Robert'); DROP TABLE callbooks;--", "cb-1"]);
    const hostile = await db.first<{ title: string }>("SELECT title FROM callbooks WHERE id = ?", ["cb-1"]);
    expect(hostile?.title).toBe("Robert'); DROP TABLE callbooks;--");
    await db.run("UPDATE callbooks SET title = ? WHERE id = ?", ["Contractor outreach", "cb-1"]);
  });

  it("rolls the whole batch back when one statement fails", async () => {
    await expect(
      db.batch([
        {
          sql: "INSERT INTO call_nodes (id, callbook_id, type, title, script, created_at, updated_at) VALUES (?, ?, 'message', ?, '', ?, ?)",
          params: ["n-rollback", "cb-1", "Should not persist", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"],
        },
        {
          // Duplicate primary key -> the batch must fail and undo the insert above.
          sql: "INSERT INTO call_nodes (id, callbook_id, type, title, script, created_at, updated_at) VALUES (?, ?, 'message', ?, '', ?, ?)",
          params: ["n-rollback", "cb-1", "Duplicate", "2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"],
        },
      ]),
    ).rejects.toThrow();

    const row = await db.first<{ id: string }>("SELECT id FROM call_nodes WHERE id = ?", [
      "n-rollback",
    ]);
    expect(row).toBeNull();
  });

  it("enforces foreign keys and cascades deletes", async () => {
    const now = "2026-01-01T00:00:00.000Z";

    await expect(
      db.run(
        `INSERT INTO call_nodes (id, callbook_id, type, title, script, created_at, updated_at)
         VALUES (?, ?, 'message', ?, '', ?, ?)`,
        ["orphan", "missing-callbook", "Orphan", now, now],
      ),
    ).rejects.toThrow();

    await db.run(
      `INSERT INTO call_nodes (id, callbook_id, type, title, script, created_at, updated_at)
       VALUES (?, ?, 'message', ?, '', ?, ?)`,
      ["n-1", "cb-1", "Opening", now, now],
    );
    await db.run(
      `INSERT INTO call_branches (id, callbook_id, from_node_id, label, example_phrases_json,
                                  next_node_id, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, '[]', NULL, 0, ?, ?)`,
      ["b-1", "cb-1", "n-1", "Interested", now, now],
    );

    await db.run("DELETE FROM callbooks WHERE id = ?", ["cb-1"]);

    expect(await db.first("SELECT id FROM call_nodes WHERE id = ?", ["n-1"])).toBeNull();
    expect(await db.first("SELECT id FROM call_branches WHERE id = ?", ["b-1"])).toBeNull();
  });
});