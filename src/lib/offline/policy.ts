import type { OutboxMethod, SendResult } from "./types";

/**
 * Rules that decide what may be queued offline and what a response means.
 *
 * These are deliberately pure and narrow: the offline queue must never invent
 * an operation the server does not support, and it must never silently drop a
 * change a user made.
 */

type QueueableWrite = {
  method: OutboxMethod;
  pattern: RegExp;
};

/**
 * The writes that can be made without a connection.
 *
 * The list is an allowlist on purpose. Anything not named here is refused by
 * `isQueueableWrite` and stays a normal online request, because replaying it
 * later would not be equivalent — a Callbook save, a publish or a quotation
 * depends on server-side validation the browser cannot reproduce.
 */
export const QUEUEABLE_WRITES: readonly QueueableWrite[] = [
  { method: "POST", pattern: /^\/api\/leads$/ },
  { method: "PATCH", pattern: /^\/api\/leads\/[^/]+$/ },
  { method: "POST", pattern: /^\/api\/leads\/[^/]+\/calls$/ },
  { method: "PATCH", pattern: /^\/api\/follow-ups\/[^/]+$/ },
  {
    method: "POST",
    pattern: /^\/api\/sessions\/[^/]+\/(advance|back|notes|unexpected|finish)$/,
  },
];

/** Pathname only: the queue must not care which host it is talking to. */
export function pathnameOf(url: string): string {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url;
  }
}

export function isQueueableWrite(method: string, url: string): boolean {
  const upper = method.toUpperCase();
  const path = pathnameOf(url);
  return QUEUEABLE_WRITES.some((entry) => entry.method === upper && entry.pattern.test(path));
}

/**
 * Statuses that mean "try again later" rather than "this will never work".
 *
 * 5xx is a server or platform hiccup, 408 a timeout, 429 rate limiting. Every
 * other 4xx is a decision about the request itself, so repeating it is pointless.
 */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

/** Maps an HTTP status onto the queue's vocabulary. */
export function classifyStatus(status: number): SendResult["kind"] {
  if (status >= 200 && status < 300) return "ok";
  if (isRetryableStatus(status)) return "retry";
  return "rejected";
}

/** A transport failure has no status: the request never reached a server. */
export function classifyTransportFailure(): SendResult {
  return { kind: "retry", status: null, message: "No connection to the server." };
}
