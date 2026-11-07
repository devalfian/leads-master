import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { addDays } from "@/lib/analytics/period";
import { followUpToday } from "./follow-up-time";

/**
 * Phase 3 coverage against a real database built from the migrations: leads,
 * manual call logs, follow-ups, the merged Call History and the API contracts.
 * Callbook run history is exercised alongside to prove it is intact.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-leads-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "leads.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const repo = await import("./repository");
const guidesRepo = await import("@/lib/guides/repository");
const callbooksRepo = await import("@/lib/callbooks/repository");
const { RepositoryError } = await import("@/lib/db");

let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

async function market(code: string) {
  const guides = await guidesRepo.listMarketGuides();
  return guides.find((guide) => guide.market.code === code)!;
}

async function makeLead(
  overrides: Partial<Parameters<typeof repo.createLead>[0]> = {},
): Promise<Awaited<ReturnType<typeof repo.createLead>>> {
  const usa = await market("USA");
  return repo.createLead({
    businessName: "Miami Aesthetic Studio",
    marketId: usa.market.id,
    ...overrides,
  });
}

describe("duplicate detection", () => {
  it("warns on a matching phone number, domain or name plus city", async () => {
    const usa = await market("USA");
    const created = await makeLead({
      businessName: "Dup Studio",
      phone: "0812-3456-7890",
      website: "https://dupstudio.example/contact",
      city: "Miami",
    });

    const byPhone = await repo.findPossibleDuplicates(
      { businessName: "Something else", phone: "+62 812 3456 7890" },
      { marketId: usa.market.id },
    );
    expect(byPhone.map((lead) => lead.id)).toContain(created.id);

    const byDomain = await repo.findPossibleDuplicates(
      { businessName: "Another name", website: "www.dupstudio.example" },
      { marketId: usa.market.id },
    );
    expect(byDomain.map((lead) => lead.id)).toContain(created.id);

    const byNameAndCity = await repo.findPossibleDuplicates(
      { businessName: "  dup   studio ", city: "miami" },
      { marketId: usa.market.id },
    );
    expect(byNameAndCity.map((lead) => lead.id)).toContain(created.id);

    // A name alone is too weak to warn on.
    const nameOnly = await repo.findPossibleDuplicates(
      { businessName: "dup studio" },
      { marketId: usa.market.id },
    );
    expect(nameOnly.map((lead) => lead.id)).not.toContain(created.id);

    // The record itself is excluded when editing.
    const self = await repo.findPossibleDuplicates(
      { businessName: "Dup Studio", city: "Miami" },
      { marketId: usa.market.id, excludeId: created.id },
    );
    expect(self.map((lead) => lead.id)).not.toContain(created.id);
  });
});

describe("lead list", () => {
  it("filters, sorts and paginates in SQL", async () => {
    const au = await market("AU");
    const plumbing = au.nicheCategories.find((entry) => entry.name === "Plumbing")!;

    await repo.createLead({
      businessName: "Zeta Plumbing",
      marketId: au.market.id,
      nicheCategoryId: plumbing.id,
      status: "contacted",
      website: "https://zeta.example",
    });
    const alpha = await repo.createLead({
      businessName: "Alpha Electrical",
      marketId: au.market.id,
      status: "new",
    });
    await repo.logLeadCall(alpha.id, { outcomeKey: "interested_no_meeting" });

    const byMarket = await repo.listLeads({ marketCode: "AU", pageSize: 50 });
    expect(byMarket.leads.every((lead) => lead.marketCode === "AU")).toBe(true);

    const byName = await repo.listLeads({ marketCode: "AU", sort: "name", pageSize: 50 });
    expect(byName.leads.map((lead) => lead.businessName)[0]).toBe("Alpha Electrical");

    const never = await repo.listLeads({ marketCode: "AU", contact: "never", pageSize: 50 });
    expect(never.leads.map((lead) => lead.businessName)).toContain("Zeta Plumbing");
    expect(never.leads.map((lead) => lead.businessName)).not.toContain("Alpha Electrical");

    const withWebsite = await repo.listLeads({ marketCode: "AU", website: "known", pageSize: 50 });
    expect(withWebsite.leads.map((lead) => lead.businessName)).toEqual(["Zeta Plumbing"]);

    const search = await repo.listLeads({ query: "zeta", pageSize: 50 });
    expect(search.leads).toHaveLength(1);

    const paged = await repo.listLeads({ marketCode: "AU", pageSize: 1, page: 2 });
    expect(paged.leads).toHaveLength(1);
    expect(paged.total).toBeGreaterThanOrEqual(2);

    const statusFilter = await repo.listLeads({ status: "contacted", pageSize: 50 });
    expect(statusFilter.leads.map((lead) => lead.businessName)).toEqual(["Zeta Plumbing"]);
  });
});

describe("lead records", () => {
  it("saves a lead with only the required fields", async () => {
    const lead = await makeLead({ city: "Miami, Florida" });

    expect(lead.businessName).toBe("Miami Aesthetic Studio");
    expect(lead.marketCode).toBe("USA");
    expect(lead.status).toBe("new");
    expect(lead.phone).toBeNull();
    expect(lead.website).toBeNull();
    expect(lead.doNotContact).toBe(false);
  });

  it("requires a market and rejects a niche from another market", async () => {
    const id = await market("ID");
    const usa = await market("USA");
    const medSpa = usa.nicheCategories.find((entry) => entry.name === "Med Spa & Aesthetic")!;

    await expect(
      repo.createLead({ businessName: "No market", marketId: "" }),
    ).rejects.toBeInstanceOf(RepositoryError);

    await expect(
      repo.createLead({
        businessName: "Wrong niche",
        marketId: id.market.id,
        nicheCategoryId: medSpa.id,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });

  it("normalises the website and keeps a niche inside the market", async () => {
    const usa = await market("USA");
    const roofing = usa.nicheCategories.find((entry) => entry.name === "Roofing")!;
    const lead = await makeLead({
      businessName: "Harbour Roofing",
      website: "harbourroofing.example",
      nicheCategoryId: roofing.id,
      estimatedValueAmount: 1500,
    });

    expect(lead.website).toBe("https://harbourroofing.example");
    expect(lead.nicheName).toBe("Roofing");
    expect(lead.estimatedValueAmount).toBe(1500);
  });

  it("edits a lead without touching its calls", async () => {
    const lead = await makeLead({ businessName: "Rename Me", phone: "3055550100" });
    await repo.logLeadCall(lead.id, { outcomeKey: "no_answer", notes: "First attempt" });

    const updated = await repo.updateLead(lead.id, {
      businessName: "Renamed Business",
      phone: "3055550199",
    });

    expect(updated.businessName).toBe("Renamed Business");
    const detail = await repo.getLeadDetail(lead.id);
    expect(detail?.calls[0]?.notes).toBe("First attempt");
  });
});
describe("logged calls and follow-ups", () => {
  it("saves the call, the follow-up and the lead change in one batch", async () => {
    const lead = await makeLead({ businessName: "Batch Test Co" });

    const { call, followUp } = await repo.logLeadCall(lead.id, {
      outcomeKey: "meeting_booked",
      notes: "Owner agreed to a demo walkthrough.",
      nextAction: "Send demo link",
      status: "interested",
      followUp: { dueAt: "2026-12-01", type: "review_demo", notes: "Check the demo" },
    });

    expect(call.outcomeKey).toBe("meeting_booked");
    expect(call.notes).toContain("demo walkthrough");
    expect(followUp?.dueAt).toBe("2026-12-01");
    expect(followUp?.type).toBe("review_demo");

    const detail = await repo.getLeadDetail(lead.id);
    expect(detail?.status).toBe("interested");
    expect(detail?.callCount).toBe(1);
    expect(detail?.followUps).toHaveLength(1);
    expect(detail?.lastContactAt).not.toBeNull();
  });

  it("does not change the lead status unless the user chose one", async () => {
    const lead = await makeLead({ businessName: "Status Untouched" });
    await repo.logLeadCall(lead.id, { outcomeKey: "no_answer" });

    const detail = await repo.getLeadDetail(lead.id);
    expect(detail?.status).toBe("new");
  });

  it("rejects an unknown outcome and a package from another market", async () => {
    const lead = await makeLead({ businessName: "Guard Test" });
    const id = await market("ID");
    const indonesianPackage = id.packages[0]!;

    await expect(repo.logLeadCall(lead.id, { outcomeKey: "made_up" })).rejects.toBeInstanceOf(
      RepositoryError,
    );
    await expect(
      repo.logLeadCall(lead.id, {
        outcomeKey: "no_answer",
        packageId: indonesianPackage.id,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });

  it("honours do-not-contact: the flag is set and blocks new follow-ups", async () => {
    const lead = await makeLead({ businessName: "DNC Co" });

    const { call } = await repo.logLeadCall(lead.id, {
      outcomeKey: "not_interested",
      markDoNotContact: true,
      notes: "Asked not to be called again.",
    });
    expect(call.leadId).toBe(lead.id);

    const detail = await repo.getLeadDetail(lead.id);
    expect(detail?.doNotContact).toBe(true);

    await expect(
      repo.createFollowUp(lead.id, { dueAt: "2026-12-05", type: "call_back" }),
    ).rejects.toBeInstanceOf(RepositoryError);

    await expect(
      repo.logLeadCall(lead.id, {
        outcomeKey: "follow_up_later",
        followUp: { dueAt: "2026-12-06", type: "call_back" },
      }),
    ).rejects.toBeInstanceOf(RepositoryError);

    // Clearing the flag restores scheduling.
    await repo.updateLead(lead.id, { doNotContact: false });
    const followUp = await repo.createFollowUp(lead.id, {
      dueAt: "2026-12-07",
      type: "call_back",
    });
    expect(followUp.status).toBe("scheduled");
  });

  it("completes a follow-up without auto-completing an overdue one", async () => {
    const lead = await makeLead({ businessName: "Follow-up Lifecycle" });
    const overdue = await repo.createFollowUp(lead.id, {
      dueAt: "2020-01-01",
      type: "call_back",
      notes: "Old but still open",
    });

    const before = await repo.listFollowUps(lead.id);
    expect(before.find((entry) => entry.id === overdue.id)?.status).toBe("scheduled");

    const completed = await repo.setFollowUpStatus(overdue.id, "completed");
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).not.toBeNull();

    const reopened = await repo.setFollowUpStatus(overdue.id, "scheduled");
    expect(reopened.completedAt).toBeNull();

    await repo.deleteFollowUp(overdue.id);
    expect(await repo.listFollowUps(lead.id)).toHaveLength(0);
  });
});

describe("lead deletion safety", () => {
  it("refuses to delete a lead that has call history", async () => {
    const lead = await makeLead({ businessName: "Has Calls" });
    await repo.logLeadCall(lead.id, { outcomeKey: "no_answer" });

    await expect(repo.deleteLead(lead.id)).rejects.toBeInstanceOf(RepositoryError);

    // Archiving keeps the lead and its calls.
    const archived = await repo.setLeadArchived(lead.id, true);
    expect(archived.archivedAt).not.toBeNull();
    const detail = await repo.getLeadDetail(lead.id);
    expect(detail?.calls).toHaveLength(1);

    // The default list hides archived leads; the filter brings them back.
    const visible = await repo.listLeads({ query: "Has Calls", pageSize: 50 });
    expect(visible.leads).toHaveLength(0);
    const withArchived = await repo.listLeads({
      query: "Has Calls",
      includeArchived: true,
      pageSize: 50,
    });
    expect(withArchived.leads).toHaveLength(1);
  });

  it("deletes a lead with no calls", async () => {
    const lead = await makeLead({ businessName: "No Calls Yet" });
    await repo.deleteLead(lead.id);
    expect(await repo.getLead(lead.id)).toBeNull();
  });
});

describe("unified call history", () => {
  it("lists Callbook runs and logged calls together, newest first", async () => {
    const usa = await market("USA");
    const medSpa = usa.nicheCategories.find((entry) => entry.name === "Med Spa & Aesthetic")!;

    const lead = await repo.createLead({
      businessName: "History Lead",
      marketId: usa.market.id,
      nicheCategoryId: medSpa.id,
    });

    await repo.logLeadCall(lead.id, {
      outcomeKey: "no_answer",
      calledAt: "2026-11-02T03:00:00.000Z",
      notes: "Logged call note",
    });

    // A Callbook run attached to the same lead.
    const callbook = await callbooksRepo.createCallbook({
      title: "History callbook",
      primaryGoal: "book_meeting",
      templateId: "digital-leads-plumbing-au-audit-led-cold-call",
      marketId: usa.market.id,
      nicheCategoryId: medSpa.id,
    });
    await callbooksRepo.publishCallbook(callbook.id);
    const session = await callbooksRepo.startCallSession(callbook.id, {
      leadId: lead.id,
    });
    expect(session.leadId).toBe(lead.id);
    expect(session.prospectName).toBe("History Lead");

    const all = await repo.listCallHistory({ leadId: lead.id, pageSize: 20 });
    expect(all.items).toHaveLength(2);
    expect(all.items.map((item) => item.kind).sort()).toEqual(["log", "session"]);
    expect(all.items.every((item) => item.marketCode === "USA")).toBe(true);
    expect(all.items.every((item) => item.leadId === lead.id)).toBe(true);

    const logsOnly = await repo.listCallHistory({ leadId: lead.id, source: "log" });
    expect(logsOnly.items.map((item) => item.notes)).toContain("Logged call note");

    const runsOnly = await repo.listCallHistory({ leadId: lead.id, source: "session" });
    expect(runsOnly.items).toHaveLength(1);
    expect(runsOnly.items[0]?.title).toBe("History callbook");
    expect(runsOnly.items[0]?.status).toBe("in_progress");
  });

  it("keeps callbook history that was never attached to a lead visible", async () => {
    const callbook = await callbooksRepo.createCallbook({
      title: "Legacy history callbook",
      primaryGoal: "book_meeting",
      templateId: "digital-leads-plumbing-au-audit-led-cold-call",
    });
    await callbooksRepo.publishCallbook(callbook.id);
    const session = await callbooksRepo.startCallSession(callbook.id, {
      prospectName: "Legacy prospect",
    });
    expect(session.leadId).toBeNull();

    const history = await repo.listCallHistory({ query: "legacy prospect", pageSize: 20 });
    expect(history.items).toHaveLength(1);
    expect(history.items[0]?.leadId).toBeNull();
    expect(history.items[0]?.prospectName).toBe("Legacy prospect");
  });

  it("filters by market, outcome and date, and paginates", async () => {
    const au = await market("AU");
    const lead = await repo.createLead({ businessName: "AU History", marketId: au.market.id });
    await repo.logLeadCall(lead.id, {
      outcomeKey: "meeting_booked",
      calledAt: "2026-10-15T02:00:00.000Z",
    });
    await repo.logLeadCall(lead.id, {
      outcomeKey: "no_answer",
      calledAt: "2026-10-20T02:00:00.000Z",
    });

    const auOnly = await repo.listCallHistory({ marketCode: "AU", pageSize: 20 });
    expect(auOnly.items.every((item) => item.marketCode === "AU")).toBe(true);

    const meetings = await repo.listCallHistory({
      leadId: lead.id,
      outcomeKey: "meeting_booked",
      pageSize: 20,
    });
    expect(meetings.items).toHaveLength(1);

    const window = await repo.listCallHistory({
      leadId: lead.id,
      from: "2026-10-16",
      to: "2026-10-31",
      pageSize: 20,
    });
    expect(window.items).toHaveLength(1);
    expect(window.items[0]?.outcomeKey).toBe("no_answer");

    const paged = await repo.listCallHistory({ leadId: lead.id, pageSize: 1, page: 1 });
    expect(paged.items).toHaveLength(1);
    expect(paged.total).toBe(2);
  });
});

describe("lead activity timeline", () => {
  it("contains real events only", async () => {
    const lead = await makeLead({ businessName: "Timeline Co", source: "Google Maps" });
    await repo.logLeadCall(lead.id, { outcomeKey: "no_answer", notes: "Rang out" });
    await repo.createFollowUp(lead.id, { dueAt: "2026-12-10", type: "call_back" });

    const detail = await repo.getLeadDetail(lead.id);
    const kinds = detail!.timeline.map((entry) => entry.kind);
    expect(kinds).toContain("lead_created");
    expect(kinds).toContain("call");
    expect(kinds).toContain("follow_up");
    // Newest first.
    const times = detail!.timeline.map((entry) => entry.at);
    expect([...times].sort().reverse()).toEqual(times);
  });
});

describe("follow-up day counting", () => {
  it("counts a follow-up due today as due today, whatever shape it is stored in", async () => {
    const lead = await makeLead({ businessName: "Due Day Co" });
    const today = followUpToday();
    const before = await repo.getLeadStats();

    // The lead forms store a calendar day…
    await repo.createFollowUp(lead.id, { dueAt: today, type: "call_back" });
    // …a completed Callbook call stores an instant inside the same reporting day.
    await repo.createFollowUp(lead.id, { dueAt: `${today}T02:00:00.000Z`, type: "meeting" });
    // Yesterday is the only one that is overdue.
    await repo.createFollowUp(lead.id, {
      dueAt: addDays(today, -1),
      type: "call_back",
    });

    const after = await repo.getLeadStats();
    expect(after.dueToday - before.dueToday).toBe(2);
    expect(after.overdue - before.overdue).toBe(1);
    expect(after.openFollowUps - before.openFollowUps).toBe(3);
  });
});

describe("Callbook call handing off to the lead", () => {
  async function publishedCallbook(marketId: string | null, title: string) {
    const callbook = await callbooksRepo.createCallbook({
      title,
      primaryGoal: "book_meeting",
      templateId: "digital-leads-plumbing-au-audit-led-cold-call",
      marketId,
    });
    await callbooksRepo.publishCallbook(callbook.id);
    return callbook;
  }

  it("turns the follow-up date on a lead-linked call into a real follow-up task", async () => {
    const usa = await market("USA");
    const lead = await makeLead({ businessName: "Callbook Hand-off Co" });
    const callbook = await publishedCallbook(usa.market.id, "Hand-off callbook");

    const session = await callbooksRepo.startCallSession(callbook.id, { leadId: lead.id });
    await callbooksRepo.finishCallSession(session.id, {
      outcomeKey: "meeting_booked",
      notes: "Wants the proposal before the meeting",
      nextAction: "Send the proposal on Monday",
      followUpAt: "2026-12-01T02:00:00.000Z",
    });

    const detail = await repo.getLeadDetail(lead.id);
    expect(detail!.followUps).toHaveLength(1);

    const task = detail!.followUps[0]!;
    expect(task.status).toBe("scheduled");
    // A booked meeting becomes a meeting to attend, not a generic callback.
    expect(task.type).toBe("meeting");
    expect(task.callSessionId).toBe(session.id);
    expect(task.leadCallId).toBeNull();
    expect(task.dueAt).toBe("2026-12-01T02:00:00.000Z");
    expect(task.notes).toBe("Send the proposal on Monday");

    // The same commitment the dashboard, Analytics and Automation read.
    expect(detail!.openFollowUpCount).toBe(1);
    expect(detail!.nextFollowUpAt).toBe("2026-12-01T02:00:00.000Z");
    expect(detail!.timeline.some((entry) => entry.kind === "follow_up")).toBe(true);
  });

  it("records no task when the call has no follow-up date", async () => {
    const usa = await market("USA");
    const lead = await makeLead({ businessName: "No Date Co" });
    const callbook = await publishedCallbook(usa.market.id, "No date callbook");

    const session = await callbooksRepo.startCallSession(callbook.id, { leadId: lead.id });
    const finished = await callbooksRepo.finishCallSession(session.id, {
      outcomeKey: "no_answer",
      notes: "Rang out",
    });

    expect(finished.followUpAt).toBeNull();
    const detail = await repo.getLeadDetail(lead.id);
    expect(detail!.followUps).toHaveLength(0);
    expect(detail!.openFollowUpCount).toBe(0);
  });

  it("keeps a follow-up date on a call that was never linked to a lead", async () => {
    const callbook = await publishedCallbook(null, "Standalone callbook");
    const session = await callbooksRepo.startCallSession(callbook.id, {
      prospectName: "Walk-in prospect",
    });
    expect(session.leadId).toBeNull();

    const finished = await callbooksRepo.finishCallSession(session.id, {
      outcomeKey: "follow_up_later",
      nextAction: "Call back next week",
      followUpAt: "2026-12-02T02:00:00.000Z",
    });

    // Call History keeps the date; there is no lead to schedule a task on.
    expect(finished.followUpAt).toBe("2026-12-02T02:00:00.000Z");
    const history = await repo.listCallHistory({ query: "walk-in", pageSize: 5 });
    expect(history.items[0]?.followUpAt).toBe("2026-12-02T02:00:00.000Z");
  });

  it("saves the call result but withholds the task for a do-not-contact lead", async () => {
    const usa = await market("USA");
    const lead = await makeLead({ businessName: "Do Not Call Co", doNotContact: true });
    const callbook = await publishedCallbook(usa.market.id, "Guard callbook");

    const session = await callbooksRepo.startCallSession(callbook.id, { leadId: lead.id });
    const finished = await callbooksRepo.finishCallSession(session.id, {
      outcomeKey: "follow_up_later",
      followUpAt: "2026-12-03T02:00:00.000Z",
    });

    expect(finished.status).toBe("completed");
    const detail = await repo.getLeadDetail(lead.id);
    expect(detail!.followUps).toHaveLength(0);
  });
});