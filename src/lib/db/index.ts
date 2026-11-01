import { createD1Executor, type D1Like } from "./d1";
import { createLocalSqliteExecutor } from "./local-sqlite";
import { DatabaseNotConfiguredError, type DbExecutor } from "./types";

/**
 * Resolves the database executor.
 *
 * 1. Cloudflare D1 binding `DB` (production on Workers, and `wrangler dev`).
 * 2. Local file-backed SQLite (development only).
 *
 * A production build never falls back to the local driver: a missing binding is
 * reported as a configuration error instead of silently writing to a file that
 * does not exist in the Workers runtime.
 */

const BINDING_NAME = "DB";

type CloudflareEnv = { [BINDING_NAME]?: D1Like };

const globalWithCache = globalThis as typeof globalThis & {
  __leadsMasterDb?: DbExecutor;
  __leadsMasterDbPromise?: Promise<DbExecutor>;
};

async function resolveD1(): Promise<D1Like | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const env = context?.env as CloudflareEnv | undefined;
    const binding = env?.[BINDING_NAME];
    if (binding && typeof binding.prepare === "function") return binding;
    return null;
  } catch {
    // No Cloudflare context in this runtime (for example `next dev` or tests).
    return null;
  }
}

async function createExecutor(): Promise<DbExecutor> {
  const d1 = await resolveD1();
  if (d1) return createD1Executor(d1);

  if (process.env.NODE_ENV === "production") {
    throw new DatabaseNotConfiguredError(
      "The Cloudflare D1 binding `DB` is not available. Bind a D1 database named " +
        "`DB` in wrangler.jsonc (see README) and redeploy.",
    );
  }

  return createLocalSqliteExecutor();
}

export async function getDb(): Promise<DbExecutor> {
  if (globalWithCache.__leadsMasterDb) return globalWithCache.__leadsMasterDb;
  if (!globalWithCache.__leadsMasterDbPromise) {
    globalWithCache.__leadsMasterDbPromise = createExecutor();
  }
  const db = await globalWithCache.__leadsMasterDbPromise;
  globalWithCache.__leadsMasterDb = db;
  return db;
}

export { DatabaseNotConfiguredError, RepositoryError } from "./types";
export type { DbExecutor, SqlStatement, SqlValue } from "./types";