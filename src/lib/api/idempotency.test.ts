import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Idempotent replays for offline writes.
 *
 * A queued change is replayed when the connection returns, and the replay can
 * duplicate a request the server already committed. These tests use the real
 * route handlers against a database built from the migrations, so they prove the
 * guarantee end to end rather than in isolation:
 *
 * - one key, one write — even when the body differs on the replay;
 * - a refused write releases its key, so a corrected retry is still accepted;
 * - a second request never runs a write another request has claimed.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-idempotency-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "idempotency.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const { getDb } = await import("@/lib/db");
const leadsRoute = await import("@/app/api/leads/route");
const callsRoute = await import("@/app/api/leads/[id]/calls/route");
const advanceRoute = await import("@/app/api/sessions/[id]/advance/route");
const callbookSessionsRoute = await import("@/app/api/callbooks/[id]/sessions/route");
const guidesRepo = await import("@/lib/guides/repository");
const callbooksRepo = await import("@/lib/callbooks/repository");
const leadsRepo = await import("@/lib/leads/repository");

let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function request(url: string, method: string, body: unknown, key?: string) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      ...(key ? { "idempotency-key": key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const params = <T extends Record<string, string>>(values: T) => ({
  params: Promise.resolve(values),
});

async function usaMarket() {
  const guides = await guidesRepo.listMarketGuides();
  return guides.find((guide) => guide.market.code === "USA")!;
}

async function countLeads(businessName: string): Promise<number> {
  const db = await getDb();
  const row = await db.first<{ total: number }>(
    "SELECT COUNT(*) AS total FROM leads WHERE business_name = ?",
    [businessName],
  );
  return row?.total ?? 0;
}

describe("a replayed lead write", () => {
  it("is answered from the receipt instead of being written again", async () => {
    const usa = await usaMarket();
    const body = { businessName: "Replay Studio", marketId: usa.market.id };
    const first = await leadsRoute.POST(request("http://test/api/leads", "POST", body, "key-1"));

    expect(first.status).toBe(201);
    expect(first.headers.get("idempotent-replay")).toBeNull();
    const created = (await first.json()).data.lead;
    expect(await countLeads("Replay Studio")).toBe(1);

    // The replayed request carries a different body on purpose: the stored
    // response is what the client already received, so it must be what returns.
    const replay = await leadsRoute.POST(
      request("http://test/api/leads", "POST", { ...body, phone: "3055559999" }, "key-1"),
    );

    expect(replay.status).toBe(201);
    expect(replay.headers.get("idempotent-replay")).toBe("true");
    expect((await replay.json()).data.lead.id).toBe(created.id);
    expect(await countLeads("Replay Studio")).toBe(1);
  });

  it("creates a second record when the key is different", async () => {
    const usa = await usaMarket();
    const body = { businessName: "Two Keys Co", marketId: usa.market.id };

    await leadsRoute.POST(request("http://test/api/leads", "POST", body, "key-a"));
    const second = await leadsRoute.POST(request("http://test/api/leads", "POST", body, "key-b"));

    expect(second.status).toBe(201);
    expect(await countLeads("Two Keys Co")).toBe(2);
  });

  it("behaves exactly as before when no key is sent", async () => {
    const usa = await usaMarket();
    const body = { businessName: "No Key Co", marketId: usa.market.id };

    await leadsRoute.POST(request("http://test/api/leads", "POST", body));
    await leadsRoute.POST(request("http://test/api/leads", "POST", body));

    expect(await countLeads("No Key Co")).toBe(2);
  });

  it("releases its key when the write is refused, so a corrected retry works", async () => {
    const usa = await usaMarket();

    const refused = await leadsRoute.POST(
      request("http://test/api/leads", "POST", { businessName: "Fix Me" }, "key-retry"),
    );
    expect(refused.status).toBe(422);
    expect(await countLeads("Fix Me")).toBe(0);

    const fixed = await leadsRoute.POST(
      request(
        "http://test/api/leads",
        "POST",
        { businessName: "Fix Me", marketId: usa.market.id },
        "key-retry",
      ),
    );

    expect(fixed.status).toBe(201);
    expect(fixed.headers.get("idempotent-replay")).toBeNull();
    expect(await countLeads("Fix Me")).toBe(1);
  });

  it("never runs a write another request has already claimed", async () => {
    const db = await getDb();
    await db.run(
      "INSERT INTO mutation_receipts (idempotency_key, nonce, method, path, status, body, created_at) " +
        "VALUES (?, ?, ?, ?, 0, '', ?)",
      ["key-in-flight", "another-tab", "POST", "/api/leads", new Date().toISOString()],
    );

    const usa = await usaMarket();
    const blocked = await leadsRoute.POST(
      request(
        "http://test/api/leads",
        "POST",
        { businessName: "In Flight Co", marketId: usa.market.id },
        "key-in-flight",
      ),
    );

    expect(blocked.status).toBe(409);
    expect((await blocked.json()).error.code).toBe("sync_in_progress");
    expect(await countLeads("In Flight Co")).toBe(0);
  });
});

describe("a replayed write inside the calling workflow", () => {
  it("records a logged call once", async () => {
    const usa = await usaMarket();
    const lead = await leadsRepo.createLead({
      businessName: "Call Replay Co",
      marketId: usa.market.id,
    });
    const url = `http://test/api/leads/${lead.id}/calls`;
    const body = { outcomeKey: "no_answer", notes: "Called twice by mistake" };

    const first = await callsRoute.POST(request(url, "POST", body, "call-key"), params({ id: lead.id }));
    expect(first.status).toBe(201);

    const replay = await callsRoute.POST(
      request(url, "POST", body, "call-key"),
      params({ id: lead.id }),
    );
    expect(replay.status).toBe(201);
    expect(replay.headers.get("idempotent-replay")).toBe("true");

    const detail = await leadsRepo.getLeadDetail(lead.id);
    expect(detail?.calls).toHaveLength(1);
  });

  it("moves a live call forward once, not twice", async () => {
    const usa = await usaMarket();
    const callbook = await callbooksRepo.createCallbook({
      title: "Replay callbook",
      primaryGoal: "book_meeting",
      templateId: "proposal-follow-up",
      marketId: usa.market.id,
    });
    await callbooksRepo.publishCallbook(callbook.id);

    const started = await callbookSessionsRoute.POST(
      request(`http://test/api/callbooks/${callbook.id}/sessions`, "POST", {}),
      params({ id: callbook.id }),
    );
    expect(started.status).toBe(201);
    const session = (await started.json()).data.session;

    const detail = await callbooksRepo.getCallSession(session.id);
    const current = detail!.snapshot.nodes.find((node) => node.id === detail!.currentNodeId)!;
    const branch = current.branches.find((entry) => entry.nextNodeId !== null);
    expect(branch).toBeDefined();

    const url = `http://test/api/sessions/${session.id}/advance`;

    const first = await advanceRoute.POST(
      request(url, "POST", { branchId: branch!.id }, "step-key"),
      params({ id: session.id }),
    );
    expect(first.status).toBe(200);
    const afterFirst = (await first.json()).data.session;
    expect(afterFirst.path).toHaveLength(2);

    const replay = await advanceRoute.POST(
      request(url, "POST", { branchId: branch!.id }, "step-key"),
      params({ id: session.id }),
    );
    expect(replay.status).toBe(200);
    expect(replay.headers.get("idempotent-replay")).toBe("true");

    const stored = await callbooksRepo.getCallSession(session.id);
    expect(stored!.path).toEqual(afterFirst.path);
    // The start step plus the one advance: a duplicated replay would be three.
    expect(stored!.steps).toHaveLength(2);
  });
});