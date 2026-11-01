import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * Idempotent replays for offline writes.
 *
 * A write that was queued while the device had no connection is replayed when
 * the connection returns. The replay may duplicate a request the server already
 * committed (the browser timed out, not the server), so the client sends a
 * stable `Idempotency-Key` and this module guarantees the handler runs at most
 * once per key.
 *
 * The guarantee is made with a reservation, not a post-hoc lookup: the first
 * request inserts a row with `status = 0` and a private nonce, then re-reads it.
 * Whoever's nonce is stored owns the key; everyone else either replays the
 * stored response or is told the write is still in flight. That closes the race
 * two simultaneous replays would otherwise win by both running the handler.
 *
 * A route that does not receive the header behaves exactly as before, so this is
 * additive: nothing changes for an online request from the browser.
 */

export const IDEMPOTENCY_HEADER = "idempotency-key";

/** Longer keys are treated as malformed and ignored rather than rejected. */
const MAX_KEY_LENGTH = 200;

/** `status` value that means "claimed, handler still running". */
const IN_FLIGHT = 0;

type ReceiptRow = {
  nonce: string;
  method: string;
  path: string;
  status: number;
  body: string;
};

/**
 * Reads the key from the request. An absent, blank or absurdly long header is
 * `null`, which means "no replay protection" — a malformed header must never
 * stop a user's write from going through.
 */
export function readIdempotencyKey(request: Request): string | null {
  const raw = request.headers.get(IDEMPOTENCY_HEADER);
  if (!raw) return null;
  const key = raw.trim();
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) return null;
  return key;
}

function requestPath(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}

function replay<T>(receipt: ReceiptRow): NextResponse<T> | null {
  let payload: unknown;
  try {
    payload = JSON.parse(receipt.body);
  } catch {
    return null;
  }
  return NextResponse.json(payload as T, {
    status: receipt.status,
    headers: { "idempotent-replay": "true" },
  });
}

function inFlightResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        message:
          "This change is already being saved. Reload in a moment to see the result.",
        code: "sync_in_progress",
      },
    },
    { status: 409 },
  );
}

/**
 * Runs `handler` at most once per `Idempotency-Key`.
 *
 * Only successful responses are stored. A rejected write (validation, conflict)
 * releases the reservation so the user can correct the queued change and retry
 * it later with the same key.
 */
export async function withIdempotency(
  request: Request,
  context: string,
  handler: () => Promise<NextResponse<unknown>>,
): Promise<NextResponse<unknown>> {
  const key = readIdempotencyKey(request);
  if (!key) return handler();

  // Idempotency is a safety net, not a dependency: if the database cannot be
  // reached here the handler must still run and report its own error.
  let db: Awaited<ReturnType<typeof getDb>>;
  try {
    db = await getDb();
  } catch {
    return handler();
  }

  const method = request.method.toUpperCase();
  const path = requestPath(request);
  const nonce = crypto.randomUUID();
  const now = new Date().toISOString();

  let owner: ReceiptRow | null;
  try {
    await db.run(
      "INSERT OR IGNORE INTO mutation_receipts " +
        "(idempotency_key, nonce, method, path, status, body, created_at) " +
        "VALUES (?, ?, ?, ?, 0, '', ?)",
      [key, nonce, method, path, now],
    );
    owner = await db.first<ReceiptRow>(
      "SELECT nonce, method, path, status, body FROM mutation_receipts WHERE idempotency_key = ?",
      [key],
    );
  } catch (error) {
    console.error(`[${context}] idempotency bookkeeping failed`, error);
    return handler();
  }

  if (!owner || owner.nonce !== nonce) {
    // Another request created the key first.
    if (!owner) return handler();
    if (owner.method === method && owner.path === path && owner.status !== IN_FLIGHT) {
      const replayed = replay(owner);
      if (replayed) return replayed;
    }
    return inFlightResponse();
  }

  let response: NextResponse<unknown>;
  try {
    response = await handler();
  } catch (error) {
    await release(db, key, nonce, context);
    throw error;
  }

  if (response.status >= 200 && response.status < 300) {
    try {
      const body = await response.clone().text();
      await db.run(
        "UPDATE mutation_receipts SET status = ?, body = ? " +
          "WHERE idempotency_key = ? AND nonce = ?",
        [response.status, body, key, nonce],
      );
    } catch (error) {
      // The write itself succeeded; losing the receipt only means a later replay
      // could repeat it. Report nothing to the user, but leave a trace.
      console.error(`[${context}] could not store the idempotency receipt`, error);
    }
  } else {
    await release(db, key, nonce, context);
  }

  return response;
}

async function release(
  db: Awaited<ReturnType<typeof getDb>>,
  key: string,
  nonce: string,
  context: string,
): Promise<void> {
  try {
    await db.run("DELETE FROM mutation_receipts WHERE idempotency_key = ? AND nonce = ?", [
      key,
      nonce,
    ]);
  } catch (error) {
    console.error(`[${context}] could not release the idempotency reservation`, error);
  }
}
