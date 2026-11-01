import type { DbExecutor, SqlParams, SqlStatement } from "./types";

/**
 * Structural types for the subset of the Cloudflare D1 API this application
 * uses. They mirror `@cloudflare/workers-types` without adding a dependency on
 * ambient Worker globals in application code.
 */
type D1Result<T> = { results?: T[]; success: boolean; error?: string };

type D1PreparedStatement = {
  bind(...values: SqlParams): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
  first<T>(): Promise<T | null>;
  run(): Promise<D1Result<unknown>>;
};

export type D1Like = {
  prepare(sql: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
};

function assertNoError(result: { success: boolean; error?: string }, sql: string): void {
  if (!result.success) {
    throw new Error(`D1 statement failed: ${result.error ?? "unknown error"} (${sql.slice(0, 80)})`);
  }
}

export function createD1Executor(db: D1Like): DbExecutor {
  const prepare = (sql: string, params?: SqlParams): D1PreparedStatement =>
    params && params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);

  return {
    driver: "d1",
    async all<T>(sql: string, params?: SqlParams): Promise<T[]> {
      const result = await prepare(sql, params).all<T>();
      assertNoError(result, sql);
      return result.results ?? [];
    },
    async first<T>(sql: string, params?: SqlParams): Promise<T | null> {
      const row = await prepare(sql, params).first<T>();
      return row ?? null;
    },
    async run(sql: string, params?: SqlParams): Promise<void> {
      const result = await prepare(sql, params).run();
      assertNoError(result, sql);
    },
    async batch(statements: readonly SqlStatement[]): Promise<void> {
      if (statements.length === 0) return;
      const prepared = statements.map((statement) => prepare(statement.sql, statement.params));
      const results = (await db.batch(prepared)) as D1Result<unknown>[];
      for (const [index, result] of results.entries()) {
        const statement = statements[index];
        assertNoError(result, statement?.sql ?? "batch statement");
      }
    },
  };
}