/**
 * Shapes shared by the offline queue, the browser wiring and the sync panel.
 *
 * Nothing here touches IndexedDB or `fetch`: the queue is pure orchestration
 * over an injectable store and sender so it can be tested without a browser.
 */

export const OUTBOX_STATUSES = ["pending", "failed"] as const;

/** `pending` = waiting for the network. `failed` = the server refused it. */
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const OUTBOX_METHODS = ["POST", "PATCH", "PUT", "DELETE"] as const;

export type OutboxMethod = (typeof OUTBOX_METHODS)[number];

export type OutboxRecord = {
  /** Also sent as `Idempotency-Key`, so a replay cannot repeat the write. */
  id: string;
  method: OutboxMethod;
  url: string;
  /** Serialised JSON body, `null` for a bodyless request. */
  body: string | null;
  /** Short description of what the change does, shown in the sync panel. */
  label: string;
  status: OutboxStatus;
  /** How many times a replay was attempted. */
  attempts: number;
  createdAt: string;
  lastAttemptAt: string | null;
  /** Why it is still pending, or why the server refused it. */
  lastError: string | null;
};

/**
 * What happened when one record was sent.
 *
 * `retry` means the network or the server is temporarily unavailable, so the
 * record stays queued. `rejected` means the server understood the request and
 * refused it; repeating it will not help and the user has to decide.
 */
export type SendResult =
  | { kind: "ok"; status: number; payload: unknown }
  | { kind: "retry"; status: number | null; message: string }
  | { kind: "rejected"; status: number; message: string; payload: unknown };

export type FlushSummary = {
  /** Records the server accepted and that are now removed from the queue. */
  sent: number;
  /** Records the server refused during this flush. */
  failed: number;
  /** Records still queued when the flush stopped. */
  remaining: number;
};

