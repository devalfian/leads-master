/**
 * Minimal database contract used by the repositories.
 *
 * Cloudflare D1 is the production driver. A Node-backed SQLite driver is used
 * for local development only (see `local-sqlite.ts`) because D1 itself is SQLite,
 * so both drivers execute exactly the same SQL.
 */

export type SqlValue = string | number | null;

export type SqlParams = readonly SqlValue[];

export type SqlStatement = {
  sql: string;
  params?: SqlParams;
};

export interface DbExecutor {
  /** Returns all rows. */
  all<T>(sql: string, params?: SqlParams): Promise<T[]>;
  /** Returns the first row or `null`. */
  first<T>(sql: string, params?: SqlParams): Promise<T | null>;
  /** Executes a statement that returns no rows. */
  run(sql: string, params?: SqlParams): Promise<void>;
  /** Executes statements atomically (all or nothing). */
  batch(statements: readonly SqlStatement[]): Promise<void>;
  /** Human readable driver name, surfaced in error messages and diagnostics. */
  readonly driver: "d1" | "local-sqlite";
}

export class DatabaseNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseNotConfiguredError";
  }
}

/** Raised for expected, user-facing failure conditions inside repositories. */
export class RepositoryError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RepositoryError";
    this.code = code;
  }
}