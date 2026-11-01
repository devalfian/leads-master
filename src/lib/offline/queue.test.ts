import { describe, expect, it } from "vitest";
import {
  classifyStatus,
  isQueueableWrite,
  isRetryableStatus,
  pathnameOf,
} from "./policy";
import { createOutbox, createOutboxRecord, sortOutbox } from "./queue";
import { createMemoryOutboxStore } from "./store";
import type { OutboxRecord, SendResult } from "./types";

/**
 * The offline queue is the only thing standing between a user's change and
 * losing it, so these tests pin the behaviour that matters:
 *
 * - which writes may be replayed later, and which must not be;
 * - the replay order (the server replays a sequence of steps, not a set);
 * - that a transport failure keeps the change instead of dropping it;
 * - that a refusal is surfaced to the user rather than retried forever;
 * - that two flushes can never send the same record twice.
 */

function clock() {
  let tick = 0;
  return () => {
    tick += 1;
    return `2026-01-01T00:00:${String(tick).padStart(2, "0")}.000Z`;
  };
}

function setup(respond: (record: OutboxRecord, index: number) => SendResult) {
  const store = createMemoryOutboxStore();
  const now = clock();
  let id = 0;
  let call = 0;
  const sent: OutboxRecord[] = [];

  const outbox = createOutbox({
    store,
    now,
    createId: () => `key-${(id += 1)}`,
    send: async (record) => {
      sent.push(record);
      const result = respond(record, (call += 1));
      return result;
    },
  });

  return { store, outbox, sent };
}

const queueLead = (label: string) => ({
  method: "POST" as const,
  url: "/api/leads",
  body: { businessName: label },
  label,
});

describe("what may be queued offline", () => {
  it("accepts the writes the calling workflow needs", () => {
    expect(isQueueableWrite("POST", "/api/leads")).toBe(true);
    expect(isQueueableWrite("PATCH", "/api/leads/lead-1")).toBe(true);
    expect(isQueueableWrite("POST", "/api/leads/lead-1/calls")).toBe(true);
    expect(isQueueableWrite("PATCH", "/api/follow-ups/fu-1")).toBe(true);
    for (const action of ["advance", "back", "notes", "unexpected", "finish"]) {
      expect(isQueueableWrite("POST", `/api/sessions/s-1/${action}`)).toBe(true);
    }
  });

  it("refuses writes whose result only the server can decide", () => {
    // Publishing and quoting depend on server-side validation the browser
    // cannot reproduce, so replaying them later would not be equivalent.
    expect(isQueueableWrite("PUT", "/api/callbooks/cb-1/graph")).toBe(false);
    expect(isQueueableWrite("POST", "/api/callbooks/cb-1/publish")).toBe(false);
    expect(isQueueableWrite("POST", "/api/quotes")).toBe(false);
    expect(isQueueableWrite("PATCH", "/api/quotes/q-1")).toBe(false);
    expect(isQueueableWrite("GET", "/api/leads")).toBe(false);
    expect(isQueueableWrite("POST", "/api/automation/run")).toBe(false);
  });

  it("reads only the pathname, whatever the origin", () => {
    expect(pathnameOf("https://leads.example.com/api/leads?x=1")).toBe("/api/leads");
    expect(pathnameOf("/api/leads")).toBe("/api/leads");
  });
});

describe("response classification", () => {
  it("treats 2xx as success and 4xx as a refusal", () => {
    expect(classifyStatus(200)).toBe("ok");
    expect(classifyStatus(201)).toBe("ok");
    expect(classifyStatus(422)).toBe("rejected");
    expect(classifyStatus(409)).toBe("rejected");
    expect(classifyStatus(404)).toBe("rejected");
  });

  it("retries only what a later attempt can fix", () => {
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(422)).toBe(false);
  });
});

describe("building a queued record", () => {
  it("uses the record id as the idempotency key and serialises the body", () => {
    const record = createOutboxRecord(queueLead("Miami Dental"), {
      now: () => "2026-05-01T09:00:00.000Z",
      createId: () => "abc-123",
    });

    expect(record.id).toBe("abc-123");
    expect(record.method).toBe("POST");
    expect(record.url).toBe("/api/leads");
    expect(record.body).toBe(JSON.stringify({ businessName: "Miami Dental" }));
    expect(record.status).toBe("pending");
    expect(record.attempts).toBe(0);
    expect(record.label).toBe("Miami Dental");
  });

  it("falls back to a readable label", () => {
    const record = createOutboxRecord({
      method: "POST",
      url: "/api/sessions/s-1/back",
    });
    expect(record.label).toBe("POST /api/sessions/s-1/back");
    expect(record.body).toBeNull();
  });

  it("sorts oldest first and breaks ties by id", () => {
    const records = [
      { ...createOutboxRecord(queueLead("b")), id: "b", createdAt: "2026-01-01T00:00:02.000Z" },
      { ...createOutboxRecord(queueLead("a")), id: "a", createdAt: "2026-01-01T00:00:02.000Z" },
      { ...createOutboxRecord(queueLead("c")), id: "c", createdAt: "2026-01-01T00:00:01.000Z" },
    ];
    expect(sortOutbox(records).map((record) => record.id)).toEqual(["c", "a", "b"]);
  });
});
describe("flushing the queue", () => {
  it("replays in the order the user made the changes", async () => {
    const { outbox, store, sent } = setup(() => ({
      kind: "ok",
      status: 200,
      payload: { ok: true },
    }));

    for (const label of ["First", "Second", "Third"]) {
      await outbox.enqueue(outbox.record(queueLead(label)));
    }

    const summary = await outbox.flush();

    expect(summary).toEqual({ sent: 3, failed: 0, remaining: 0 });
    expect(sent.map((record) => record.label)).toEqual(["First", "Second", "Third"]);
    expect(await store.all()).toEqual([]);
  });

  it("keeps the change when there is still no connection, and stops", async () => {
    const { outbox, store, sent } = setup((_record, index) =>
      index === 2
        ? { kind: "retry", status: null, message: "No connection to the server." }
        : { kind: "ok", status: 200, payload: { ok: true } },
    );

    for (const label of ["First", "Second", "Third"]) {
      await outbox.enqueue(outbox.record(queueLead(label)));
    }

    const summary = await outbox.flush();

    expect(summary.sent).toBe(1);
    expect(summary.remaining).toBe(2);
    // Nothing after the failure is attempted: every later record would fail the
    // same way, and skipping ahead would reorder the user's changes.
    expect(sent.map((record) => record.label)).toEqual(["First", "Second"]);

    const stuck = (await store.all()).find((record) => record.label === "Second")!;
    expect(stuck.status).toBe("pending");
    expect(stuck.attempts).toBe(1);
    expect(stuck.lastError).toBe("No connection to the server.");
  });

  it("surfaces a refused change instead of retrying it forever", async () => {
    const { outbox, store } = setup((record) =>
      record.label === "Second"
        ? {
            kind: "rejected",
            status: 422,
            message: "A business name is required.",
            payload: { ok: false, error: { message: "A business name is required." } },
          }
        : { kind: "ok", status: 201, payload: { ok: true } },
    );

    for (const label of ["First", "Second", "Third"]) {
      await outbox.enqueue(outbox.record(queueLead(label)));
    }

    const summary = await outbox.flush();

    expect(summary).toEqual({ sent: 2, failed: 1, remaining: 1 });
    const [failed] = await store.all();
    expect(failed.label).toBe("Second");
    expect(failed.status).toBe("failed");
    expect(failed.lastError).toBe("A business name is required.");

    // A later flush must not keep hammering a change the server refused.
    expect(await outbox.flush()).toEqual({ sent: 0, failed: 0, remaining: 1 });
  });

  it("lets the user retry or discard a refused change", async () => {
    let refuse = true;
    const { outbox, store } = setup(() =>
      refuse
        ? { kind: "rejected", status: 409, message: "That lead no longer exists.", payload: null }
        : { kind: "ok", status: 200, payload: { ok: true } },
    );

    const first = await outbox.enqueue(outbox.record(queueLead("Retry me")));
    const second = await outbox.enqueue(outbox.record(queueLead("Discard me")));
    await outbox.flush();

    refuse = false;
    await outbox.retry(first.id);

    const requeued = (await store.all()).find((record) => record.id === first.id)!;
    expect(requeued.status).toBe("pending");
    expect(requeued.lastError).toBeNull();

    await outbox.discard(second.id);
    expect((await store.all()).map((record) => record.id)).toEqual([first.id]);

    expect((await outbox.flush()).sent).toBe(1);
    expect(await store.all()).toEqual([]);
  });

  it("never sends the same change twice when two flushes overlap", async () => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    let sends = 0;
    const outbox = createOutbox({
      store: createMemoryOutboxStore(),
      now: clock(),
      createId: () => `key-${sends + 1}`,
      send: async () => {
        sends += 1;
        await gate;
        return { kind: "ok", status: 200, payload: { ok: true } };
      },
    });

    await outbox.enqueue(outbox.record(queueLead("Only once")));

    const first = outbox.flush();
    const second = outbox.flush();
    release();
    await Promise.all([first, second]);

    expect(sends).toBe(1);
  });

  it("reports an empty queue without calling the server", async () => {
    const { outbox, sent } = setup(() => ({ kind: "ok", status: 200, payload: null }));
    expect(await outbox.flush()).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(sent).toEqual([]);
  });
});