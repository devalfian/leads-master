import { pathnameOf } from "./policy";
import type { OutboxStore } from "./store";
import type {
  FlushSummary,
  OutboxMethod,
  OutboxRecord,
  SendResult,
} from "./types";

/**
 * The outbox: every change a user made while the connection was down.
 *
 * Records are replayed in the order they were made. That order matters: a call
 * logged offline is followed by a lead status change, and both must reach the
 * server in the sequence the user performed them so the server-side state
 * machine sees the same history it would have seen online.
 *
 * A flush stops at the first transport failure instead of skipping ahead,
 * because every later record would fail the same way and reordering the queue
 * would corrupt the sequence.
 */

export type OutboxDeps = {
  store: OutboxStore;
  /** Performs one request. Supplied by the browser wiring, faked in tests. */
  send: (record: OutboxRecord) => Promise<SendResult>;
  now?: () => string;
  createId?: () => string;
};

export type EnqueueInput = {
  method: OutboxMethod;
  url: string;
  body?: unknown;
  /** Human description for the sync panel, e.g. "Log a call · Miami Dental". */
  label?: string;
};

export type Outbox = {
  /** Builds the record without storing it, so an online attempt can use the same id. */
  record(input: EnqueueInput): OutboxRecord;
  enqueue(record: OutboxRecord): Promise<OutboxRecord>;
  sendNow(record: OutboxRecord): Promise<SendResult>;
  list(): Promise<OutboxRecord[]>;
  flush(): Promise<FlushSummary>;
  retry(id: string): Promise<void>;
  discard(id: string): Promise<void>;
};

function defaultLabel(method: string, url: string): string {
  return `${method} ${pathnameOf(url)}`;
}

export function createOutboxRecord(
  input: EnqueueInput,
  options: { now?: () => string; createId?: () => string } = {},
): OutboxRecord {
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? (() => crypto.randomUUID());

  return {
    id: createId(),
    method: input.method,
    url: input.url,
    body: input.body === undefined ? null : JSON.stringify(input.body),
    label: input.label?.trim() || defaultLabel(input.method, input.url),
    status: "pending",
    attempts: 0,
    createdAt: now(),
    lastAttemptAt: null,
    lastError: null,
  };
}

/** Oldest first; ties broken by id so the order is stable across reloads. */
export function sortOutbox(records: readonly OutboxRecord[]): OutboxRecord[] {
  return [...records].sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export function createOutbox(deps: OutboxDeps): Outbox {
  const now = deps.now ?? (() => new Date().toISOString());
  let inFlightFlush: Promise<FlushSummary> | null = null;

  async function list(): Promise<OutboxRecord[]> {
    return sortOutbox(await deps.store.all());
  }

  async function flush(): Promise<FlushSummary> {
    // Two flushes must never run at once: the second would replay records the
    // first is already sending and could duplicate a write.
    if (inFlightFlush) return inFlightFlush;

    inFlightFlush = (async () => {
      let sent = 0;
      let failed = 0;

      const queued = (await list()).filter((record) => record.status === "pending");

      for (const record of queued) {
        const result = await deps.send(record);

        if (result.kind === "ok") {
          await deps.store.delete(record.id);
          sent += 1;
          continue;
        }

        if (result.kind === "rejected") {
          await deps.store.put({
            ...record,
            status: "failed",
            attempts: record.attempts + 1,
            lastAttemptAt: now(),
            lastError: result.message,
          });
          failed += 1;
          continue;
        }

        // Transport failure or a retryable status: keep it queued and stop.
        await deps.store.put({
          ...record,
          attempts: record.attempts + 1,
          lastAttemptAt: now(),
          lastError: result.message,
        });
        break;
      }

      const remaining = (await deps.store.all()).length;
      return { sent, failed, remaining };
    })();

    try {
      return await inFlightFlush;
    } finally {
      inFlightFlush = null;
    }
  }

  return {
    record: (input) => createOutboxRecord(input, { now, createId: deps.createId }),
    async enqueue(record) {
      await deps.store.put(record);
      return record;
    },
    sendNow: (record) => deps.send(record),
    list,
    flush,
    async retry(id) {
      const record = (await deps.store.all()).find((entry) => entry.id === id);
      if (!record) return;
      await deps.store.put({ ...record, status: "pending", lastError: null });
    },
    async discard(id) {
      await deps.store.delete(id);
    },
  };
}
