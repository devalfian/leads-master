import type { OutboxRecord } from "./types";
import type { OutboxStore } from "./store";

/**
 * IndexedDB-backed outbox.
 *
 * IndexedDB is used rather than `localStorage` because it is asynchronous,
 * survives more quota pressure and is available in a service worker. The
 * database is opened lazily so importing this module is safe during server
 * rendering, where `indexedDB` does not exist.
 */

const DATABASE_NAME = "leads-master-offline";
const DATABASE_VERSION = 1;
const STORE_NAME = "outbox";

let connection: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;

  connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened."));
    request.onblocked = () => reject(new Error("IndexedDB is blocked by another tab."));
  });

  // A failed open must not be cached forever: a later call may succeed.
  connection.catch(() => {
    connection = null;
  });

  return connection;
}

function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | null,
): Promise<T | undefined> {
  return openDatabase().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        let request: IDBRequest<T> | null = null;
        try {
          request = action(store);
        } catch (error) {
          reject(error);
          return;
        }
        transaction.oncomplete = () => resolve(request?.result);
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed."));
        transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB write aborted."));
      }),
  );
}

export function createIndexedDbOutboxStore(): OutboxStore {
  return {
    async all() {
      const records = await run<OutboxRecord[]>("readonly", (store) => store.getAll());
      return records ?? [];
    },
    async put(record) {
      await run("readwrite", (store) => store.put(record));
    },
    async delete(id) {
      await run("readwrite", (store) => store.delete(id));
    },
  };
}

/** True in a browser tab or a worker; false during server rendering. */
export function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}
