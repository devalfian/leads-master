import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/** Route-handler contracts for leads, logged calls and follow-ups. */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-leads-api-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "leads-api.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const leadsRoute = await import("@/app/api/leads/route");
const leadRoute = await import("@/app/api/leads/[id]/route");
const callsRoute = await import("@/app/api/leads/[id]/calls/route");
const followUpsRoute = await import("@/app/api/leads/[id]/follow-ups/route");
const followUpRoute = await import("@/app/api/follow-ups/[id]/route");
const duplicatesRoute = await import("@/app/api/leads/duplicates/route");
const callbookSessionsRoute = await import("@/app/api/callbooks/[id]/sessions/route");
const repo = await import("./repository");
const guidesRepo = await import("@/lib/guides/repository");
const callbooksRepo = await import("@/lib/callbooks/repository");

let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

const json = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const params = <T extends Record<string, string>>(values: T) => ({
  params: Promise.resolve(values),
});

async function usaMarket() {
  const guides = await guidesRepo.listMarketGuides();
  return guides.find((guide) => guide.market.code === "USA")!;
}

describe("lead API", () => {
  it("creates, updates and archives a lead", async () => {
    const usa = await usaMarket();

    const created = await leadsRoute.POST(
      json("http://test/api/leads", "POST", {
        businessName: "API Lead",
        marketId: usa.market.id,
        phone: "3055550111",
      }),
    );
    expect(created.status).toBe(201);
    const createdBody = await created.json();
    const id = createdBody.data.lead.id;
    expect(createdBody.data.lead.marketCode).toBe("USA");

    const patched = await leadRoute.PATCH(
      json(`http://test/api/leads/${id}`, "PATCH", { status: "qualified" }),
      params({ id }),
    );
    expect(patched.status).toBe(200);
    expect((await patched.json()).data.lead.status).toBe("qualified");

    const archived = await leadRoute.PATCH(
      json(`http://test/api/leads/${id}`, "PATCH", { archived: true }),
      params({ id }),
    );
    expect((await archived.json()).data.lead.archivedAt).not.toBeNull();
  });

  it("rejects a lead without a market", async () => {
    const response = await leadsRoute.POST(
      json("http://test/api/leads", "POST", { businessName: "No market" }),
    );
    expect(response.status).toBe(422);
    expect((await response.json()).ok).toBe(false);
  });

  it("reports possible duplicates over the API", async () => {
    const usa = await usaMarket();
    const lead = await repo.createLead({
      businessName: "Duplicate API Co",
      marketId: usa.market.id,
      phone: "3055550123",
    });

    const response = await duplicatesRoute.GET(
      new Request(
        `http://test/api/leads/duplicates?marketId=${usa.market.id}&phone=${encodeURIComponent("+1 305 555 0123")}`,
      ),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.leads.map((entry: { id: string }) => entry.id)).toContain(lead.id);
  });
});

describe("call logging API", () => {
  it("logs a call with a follow-up and returns both records", async () => {
    const usa = await usaMarket();
    const lead = await repo.createLead({ businessName: "API Call Co", marketId: usa.market.id });

    const response = await callsRoute.POST(
      json(`http://test/api/leads/${lead.id}/calls`, "POST", {
        outcomeKey: "follow_up_later",
        notes: "Call back after lunch",
        followUp: { dueAt: "2026-12-15", type: "call_back", notes: "Lunchtime" },
      }),
      params({ id: lead.id }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.call.outcomeKey).toBe("follow_up_later");
    expect(body.data.followUp.dueAt).toBe("2026-12-15");

    const detail = await repo.getLeadDetail(lead.id);
    expect(detail?.calls).toHaveLength(1);
    expect(detail?.followUps).toHaveLength(1);
  });

  it("rejects an unknown outcome", async () => {
    const usa = await usaMarket();
    const lead = await repo.createLead({ businessName: "Bad Outcome", marketId: usa.market.id });

    const response = await callsRoute.POST(
      json(`http://test/api/leads/${lead.id}/calls`, "POST", { outcomeKey: "nope" }),
      params({ id: lead.id }),
    );
    expect(response.status).toBe(422);
  });

  it("refuses a follow-up for a do-not-contact lead", async () => {
    const usa = await usaMarket();
    const lead = await repo.createLead({
      businessName: "DNC API",
      marketId: usa.market.id,
      doNotContact: true,
    });

    const response = await callsRoute.POST(
      json(`http://test/api/leads/${lead.id}/calls`, "POST", {
        outcomeKey: "follow_up_later",
        followUp: { dueAt: "2026-12-16", type: "call_back" },
      }),
      params({ id: lead.id }),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("do_not_contact");
  });
});
describe("follow-up and deletion routes", () => {
  it("creates and completes a follow-up through its own routes", async () => {
    const usa = await usaMarket();
    const lead = await repo.createLead({ businessName: "Follow API", marketId: usa.market.id });

    const created = await followUpsRoute.POST(
      json(`http://test/api/leads/${lead.id}/follow-ups`, "POST", {
        dueAt: "2026-12-20",
        type: "send_info",
      }),
      params({ id: lead.id }),
    );
    expect(created.status).toBe(201);
    const followUpId = (await created.json()).data.followUp.id;

    const completed = await followUpRoute.PATCH(
      json(`http://test/api/follow-ups/${followUpId}`, "PATCH", { status: "completed" }),
      params({ id: followUpId }),
    );
    expect(completed.status).toBe(200);
    expect((await completed.json()).data.followUp.status).toBe("completed");

    const removed = await followUpRoute.DELETE(
      json(`http://test/api/follow-ups/${followUpId}`, "DELETE"),
      params({ id: followUpId }),
    );
    expect(removed.status).toBe(200);
  });

  it("returns 409 when deleting a lead with calls, 200 for an empty lead", async () => {
    const usa = await usaMarket();
    const withCalls = await repo.createLead({
      businessName: "Delete Guard",
      marketId: usa.market.id,
    });
    await repo.logLeadCall(withCalls.id, { outcomeKey: "no_answer" });

    const blocked = await leadRoute.DELETE(
      json(`http://test/api/leads/${withCalls.id}`, "DELETE"),
      params({ id: withCalls.id }),
    );
    expect(blocked.status).toBe(409);

    const empty = await repo.createLead({ businessName: "Delete Me", marketId: usa.market.id });
    const deleted = await leadRoute.DELETE(
      json(`http://test/api/leads/${empty.id}`, "DELETE"),
      params({ id: empty.id }),
    );
    expect(deleted.status).toBe(200);
  });
});

describe("callbook session with a lead", () => {
  it("links the call to the lead and rejects a market mismatch", async () => {
    const usa = await usaMarket();
    const lead = await repo.createLead({ businessName: "Callbook Lead", marketId: usa.market.id });

    const callbook = await callbooksRepo.createCallbook({
      title: "API callbook",
      primaryGoal: "book_meeting",
      templateId: "proposal-follow-up",
      marketId: usa.market.id,
    });
    await callbooksRepo.publishCallbook(callbook.id);

    const started = await callbookSessionsRoute.POST(
      json(`http://test/api/callbooks/${callbook.id}/sessions`, "POST", { leadId: lead.id }),
      params({ id: callbook.id }),
    );
    expect(started.status).toBe(201);
    const session = (await started.json()).data.session;
    expect(session.leadId).toBe(lead.id);
    expect(session.prospectName).toBe("Callbook Lead");

    const idGuide = await guidesRepo
      .listMarketGuides()
      .then((guides) => guides.find((guide) => guide.market.code === "ID")!);
    const idCallbook = await callbooksRepo.createCallbook({
      title: "ID callbook",
      primaryGoal: "book_meeting",
      templateId: "northbay-fnb-no-website-outreach",
      marketId: idGuide.market.id,
    });
    await callbooksRepo.publishCallbook(idCallbook.id);

    const mismatch = await callbookSessionsRoute.POST(
      json(`http://test/api/callbooks/${idCallbook.id}/sessions`, "POST", { leadId: lead.id }),
      params({ id: idCallbook.id }),
    );
    expect(mismatch.status).toBe(400);
  });
});