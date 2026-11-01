import type { OutboxRecord } from "./types";

/**
 * Persistence contract for the outbox.
 *
 * The browser uses IndexedDB (`idb-store.ts`); the tests use the in-memory
 * implementation below. Keeping the queue behind this interface is what makes
 * the sync logic testable in Node, where `indexedDB` does not exist.
 */
export interface OutboxStore {
  all(): Promise<OutboxRecord[]>;
  put(record: OutboxRecord): Promise<void>;
  delete(id: string): Promise<void>;
}

/** Test/fallback store. Order is not guaranteed: the queue sorts on read. */
export function createMemoryOutboxStore(initial: readonly OutboxRecord[] = []): OutboxStore {
  const records = new Map<string, OutboxRecord>();
  for (const record of initial) records.set(record.id, { ...record });

  return {
    async all() {
      return [...records.values()].map((record) => ({ ...record }));
    },
    async put(record) {
      records.set(record.id, { ...record });
    },
    async delete(id) {
      records.delete(id);
    },
  };
}
