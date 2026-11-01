import { apiRequest } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/types";
import { createIndexedDbOutboxStore, canUseIndexedDb } from "./idb-store";
import { classifyStatus, classifyTransportFailure, isQueueableWrite } from "./policy";
import { createOutbox, type Outbox } from "./queue";
import { createMemoryOutboxStore } from "./store";
import type { FlushSummary, OutboxMethod, OutboxRecord, SendResult } from "./types";

/**
 * Browser wiring for the offline queue.
 *
 * Everything here is lazy: the module is imported by client components that
 * Next also renders on the server, where `indexedDB`, `navigator` and `window`
 * do not exist. No top-level statement may touch them.
 */

export type MutationOutcome<T> =
  | { status: "applied"; result: ApiResult<T> }
  | { status: "queued"; id: string };

export type OfflineSnapshot = {
  online: boolean;
  syncing: boolean;
  pending: OutboxRecord[];
  failed: OutboxRecord[];
  /** Set after a flush that actually sent something, so pages can refresh. */
  lastSyncedAt: string | null;
};

const EMPTY_SNAPSHOT: OfflineSnapshot = {
  online: true,
  syncing: false,
  pending: [],
  failed: [],
  lastSyncedAt: null,
};

let snapshot: OfflineSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();
let outboxInstance: Outbox | null = null;
let startCount = 0;

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function emit(): void {
  for (const listener of listeners) listener();
}

function setSnapshot(patch: Partial<OfflineSnapshot>): void {
  snapshot = { ...snapshot, ...patch };
  emit();
}

export function getOfflineSnapshot(): OfflineSnapshot {
  return snapshot;
}

export function subscribeOffline(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
}

function errorCode(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** One HTTP attempt. Classifies the response into the queue's vocabulary. */
async function send(record: OutboxRecord): Promise<SendResult> {
  let response: Response;
  try {
    response = await fetch(record.url, {
      method: record.method,
      headers: {
        "content-type": "application/json",
        // Stable per record, so the server can recognise a replay.
        "idempotency-key": record.id,
      },
      body: record.body ?? undefined,
      cache: "no-store",
    });
  } catch {
    return classifyTransportFailure();
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const kind = classifyStatus(response.status);
  if (kind === "ok") return { kind, status: response.status, payload };

  const message = readErrorMessage(payload) ?? `The server returned ${response.status}.`;

  // Another tab holds the idempotency reservation for this write: the same
  // request is in flight, so wait rather than treating it as a refusal.
  if (kind === "rejected" && errorCode(payload) === "sync_in_progress") {
    return { kind: "retry", status: response.status, message };
  }

  if (kind === "retry") return { kind, status: response.status, message };
  return { kind: "rejected", status: response.status, message, payload };
}

function getOutbox(): Outbox {
  if (!outboxInstance) {
    outboxInstance = createOutbox({
      // Without IndexedDB (private windows, blocked storage) the queue still
      // works for the life of the tab instead of losing the user's change.
      store: canUseIndexedDb() ? createIndexedDbOutboxStore() : createMemoryOutboxStore(),
      send,
    });
  }
  return outboxInstance;
}

/** Re-reads the queue and publishes a new snapshot. */
export async function refreshOffline(): Promise<void> {
  const records = await getOutbox().list();
  setSnapshot({
    online: isOnline(),
    pending: records.filter((record) => record.status === "pending"),
    failed: records.filter((record) => record.status === "failed"),
  });
}

/**
 * Sends every queued change, oldest first.
 *
 * Safe to call repeatedly: calling it while offline is a no-op, and the queue
 * itself refuses to run two flushes at once.
 */
export async function syncNow(): Promise<FlushSummary> {
  if (!isOnline()) {
    const records = await getOutbox().list();
    setSnapshot({ online: false });
    return { sent: 0, failed: 0, remaining: records.length };
  }

  if (snapshot.syncing) {
    const records = await getOutbox().list();
    return { sent: 0, failed: 0, remaining: records.length };
  }

  setSnapshot({ syncing: true });
  try {
    const summary = await getOutbox().flush();
    await refreshOffline();
    setSnapshot({
      syncing: false,
      online: isOnline(),
      lastSyncedAt: summary.sent > 0 ? new Date().toISOString() : snapshot.lastSyncedAt,
    });
    return summary;
  } catch (error) {
    console.error("[offline] sync failed", error);
    setSnapshot({ syncing: false });
    await refreshOffline();
    return { sent: 0, failed: 0, remaining: getOfflineSnapshot().pending.length };
  }
}

export async function retryQueued(id: string): Promise<void> {
  await getOutbox().retry(id);
  await refreshOffline();
  await syncNow();
}

export async function discardQueued(id: string): Promise<void> {
  await getOutbox().discard(id);
  await refreshOffline();
}

/**
 * Performs a write, queueing it when the connection is unavailable.
 *
 * A request that reaches the server is always reported as `applied`, including
 * one the server refused: the user needs to see the validation message. Only a
 * transport failure — or being offline before the request is made — becomes a
 * queued change.
 */
export async function submitWrite<T>(input: {
  method: OutboxMethod;
  url: string;
  body?: unknown;
  label?: string;
}): Promise<MutationOutcome<T>> {
  if (!isQueueableWrite(input.method, input.url)) {
    // Not an offline-capable write: behave exactly like a plain API call.
    const result = await apiRequest<T>(input.url, {
      method: input.method,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
    });
    return { status: "applied", result };
  }

  const outbox = getOutbox();
  const record = outbox.record(input);

  if (isOnline()) {
    const outcome = await outbox.sendNow(record);
    if (outcome.kind === "ok") {
      return { status: "applied", result: outcome.payload as ApiResult<T> };
    }
    if (outcome.kind === "rejected") {
      const result =
        typeof outcome.payload === "object" && outcome.payload !== null && "ok" in outcome.payload
          ? (outcome.payload as ApiResult<T>)
          : ({ ok: false, error: { message: outcome.message } } as ApiResult<T>);
      return { status: "applied", result };
    }
  }

  await outbox.enqueue(record);
  await refreshOffline();
  return { status: "queued", id: record.id };
}

/**
 * Attaches the listeners that keep the queue in step with the connection.
 *
 * Returns a cleanup function. Reference-counted so React StrictMode mounting an
 * effect twice does not attach the listeners twice.
 */
export function startOfflineSync(): () => void {
  if (typeof window === "undefined") return () => {};

  startCount += 1;

  if (startCount === 1) {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    setSnapshot({ online: isOnline() });
    void refreshOffline().then(() => {
      if (isOnline()) void syncNow();
    });
  }

  return () => {
    startCount -= 1;
    if (startCount > 0) return;
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

function handleOnline(): void {
  setSnapshot({ online: true });
  void syncNow();
}

function handleOffline(): void {
  setSnapshot({ online: false });
}

function handleFocus(): void {
  if (isOnline()) void syncNow();
}

function handleVisibility(): void {
  if (document.visibilityState === "visible" && isOnline()) void syncNow();
}
