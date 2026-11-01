import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { DatabaseNotConfiguredError, type DbExecutor, type SqlParams, type SqlStatement } from "./types";

/**
 * Local development driver.
 *
 * Production always runs on Cloudflare D1. When the app runs under `next dev`
 * there is no D1 binding available, so this module opens a real, file-backed
 * SQLite database using Node's built-in `node:sqlite`. Both engines are SQLite,
 * so the exact same migrations and SQL statements are used.
 *
 * It is never reachable in a production build: `getDb()` throws
 * `DatabaseNotConfiguredError` instead of falling back when NODE_ENV is
 * `production`.
 */

type SqlArg = string | number | null;

type NodeStatement = {
  all(...params: SqlArg[]): unknown[];
  get(...params: SqlArg[]): unknown;
  run(...params: SqlArg[]): unknown;
};

type NodeDatabase = {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
};

type NodeSqliteModule = {
  DatabaseSync: new (location: string) => NodeDatabase;
};

let cached: { db: NodeDatabase; filePath: string } | null = null;

export function localDatabasePath(): string {
  if (process.env.LOCAL_DATABASE_PATH) return process.env.LOCAL_DATABASE_PATH;
  return path.join(process.cwd(), ".data", "leads-master.sqlite");
}

/** Closes the cached local handle (used by tests and clean shutdowns). */
export function closeLocalDatabase(): void {
  if (!cached) return;
  try {
    cached.db.close();
  } catch {
    // Nothing useful to do if the handle is already closed.
  }
  cached = null;
}

async function openDatabase(): Promise<NodeDatabase> {
  if (cached) return cached.db;

  const filePath = localDatabasePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  let mod: NodeSqliteModule;
  try {
    mod = (await import("node:sqlite")) as unknown as NodeSqliteModule;
  } catch {
    throw new DatabaseNotConfiguredError(
      "Local SQLite support (node:sqlite) is unavailable in this Node.js runtime. " +
        "Use Node 22.5 or newer, or run the app on Cloudflare Workers with a D1 binding.",
    );
  }

  const db = new mod.DatabaseSync(filePath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");

  cached = { db, filePath };
  await applyMigrations(db);
  return db;
}

/** Applies `migrations/*.sql` in filename order, tracked in `_local_migrations`. */
async function applyMigrations(db: NodeDatabase): Promise<void> {
  db.exec(
    "CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );

  const migrationsDir = path.join(process.cwd(), "migrations");
  let files: string[];
  try {
    files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
  } catch {
    throw new DatabaseNotConfiguredError(
      `Could not read database migrations from ${migrationsDir}.`,
    );
  }

  const appliedRows = db.prepare("SELECT name FROM _local_migrations").all() as Array<{
    name: string;
  }>;
  const applied = new Set(appliedRows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO _local_migrations (name, applied_at) VALUES (?, ?)").run(
        file,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

export async function createLocalSqliteExecutor(): Promise<DbExecutor> {
  const db = await openDatabase();

  const statement = (sql: string): NodeStatement => db.prepare(sql);

  return {
    driver: "local-sqlite",
    async all<T>(sql: string, params?: SqlParams): Promise<T[]> {
      return statement(sql).all(...(params ?? [])) as T[];
    },
    async first<T>(sql: string, params?: SqlParams): Promise<T | null> {
      const row = statement(sql).get(...(params ?? []));
      return (row as T | undefined) ?? null;
    },
    async run(sql: string, params?: SqlParams): Promise<void> {
      statement(sql).run(...(params ?? []));
    },
    async batch(statements: readonly SqlStatement[]): Promise<void> {
      if (statements.length === 0) return;
      db.exec("BEGIN");
      try {
        for (const entry of statements) {
          statement(entry.sql).run(...(entry.params ?? []));
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}