import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { SessionInput } from "./repository";

/**
 * Session persistence against a real SQLite database: create, reopen, edit,
 * duplicate, delete, and the guarantee that a snapshot does not move when the
 * master pricing data changes underneath it.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-guides-sessions-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "sessions.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const { RepositoryError } = await import("@/lib/db");
const repo = await import("./repository");

let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

async function guideFor(code: string) {
  const guides = await repo.listMarketGuides();
  const guide = guides.find((candidate) => candidate.market.code === code);
  if (!guide) throw new Error(`missing market ${code}`);
  return guide;
}

async function inputFor(
  marketCode: string,
  overrides: Partial<SessionInput> = {},
): Promise<SessionInput> {
  const guide = await guideFor(marketCode);
  return {
    marketCode,
    scheduleId: guide.schedules[0].id,
    nicheSlug: guide.nicheCategories[0].slug,
    sessionDate: "2026-11-02",
    title: `${guide.market.name} session`,
    objective: guide.callObjectives[0].goalText,
    customNotes: "",
    ...overrides,
  };
}

describe("session lifecycle", () => {
  it("creates a session in D1 and reads it back", async () => {
    const created = await repo.createSession(await inputFor("ID"));

    expect(created.id).toMatch(/^session_/);
    expect(created.marketCode).toBe("ID");
    expect(created.sessionDate).toBe("2026-11-02");

    const reopened = await repo.getSession(created.id);
    expect(reopened?.title).toBe(created.title);
    expect(reopened?.snapshot.market.code).toBe("ID");
    expect(reopened?.snapshot.recommendedPackage?.name).toBe("Growth");
    expect(reopened?.snapshot.recommendedPackage?.priceAmount).toBe(3500000);
    expect(reopened?.snapshot.schedule?.startTimeWib).toBe("09:00");
    expect(reopened?.snapshot.checklist.length).toBe(6);
  });

  it("saves the niche-specific price for a US law-firm session", async () => {
    const guide = await guideFor("USA");
    const lawFirm = guide.nicheCategories.find(
      (category) => category.name === "Law Firm & Professional",
    )!;
    const created = await repo.createSession(
      await inputFor("USA", { nicheSlug: lawFirm.slug, sessionDate: "2026-11-03" }),
    );

    expect(created.snapshot.priceSource).toBe("niche");
    expect(created.snapshot.recommendedPackage?.priceAmount).toBe(1500);
    expect(created.snapshot.recommendedPackage?.standardPriceAmount).toBe(750);
    expect(created.snapshot.nichePriceGroups.map((group) => group.label)).toEqual([
      "Law Firm",
      "Accounting / Consulting",
    ]);
  });

  it("lists the newest session date first", async () => {
    const sessions = await repo.listSessions();
    const dates = sessions.map((session) => session.sessionDate);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("rejects a schedule that belongs to another market", async () => {
    const au = await guideFor("AU");
    await expect(
      repo.createSession(await inputFor("ID", { scheduleId: au.schedules[0].id })),
    ).rejects.toThrow(/does not belong/);
  });

  it("rejects a niche that belongs to another market", async () => {
    const usa = await guideFor("USA");
    await expect(
      repo.createSession(await inputFor("ID", { nicheSlug: usa.nicheCategories[0].slug })),
    ).rejects.toThrow(/does not belong/);
  });

  it("rejects an objective that is not in the market's guide data", async () => {
    await expect(
      repo.createSession(await inputFor("ID", { objective: "Close a deal today." })),
    ).rejects.toBeInstanceOf(RepositoryError);
  });
});
describe("session editing and duplication", () => {
  it("edits a session in place and refreshes its snapshot", async () => {
    const created = await repo.createSession(await inputFor("AU"));
    const guide = await guideFor("AU");

    const updated = await repo.updateSession(created.id, {
      ...(await inputFor("AU")),
      title: "Adelaide morning block",
      scheduleId: guide.schedules[1].id,
      sessionDate: "2026-11-05",
      customNotes: "Focus on roofers.",
    });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Adelaide morning block");
    expect(updated.sessionDate).toBe("2026-11-05");
    expect(updated.snapshot.schedule?.startTimeWib).toBe("06:30");
    expect(updated.snapshot.notes).toBe("Focus on roofers.");
  });

  it("duplicates a session into a new record with the same snapshot", async () => {
    const created = await repo.createSession(await inputFor("USA"));
    const copy = await repo.duplicateSession(created.id);

    expect(copy.id).not.toBe(created.id);
    expect(copy.title).toBe(`${created.title} (copy)`);
    expect(copy.snapshot.recommendedPackage?.priceAmount).toBe(
      created.snapshot.recommendedPackage?.priceAmount,
    );
    expect(copy.snapshot.schedule?.id).toBe(created.snapshot.schedule?.id);
  });

  it("deletes a session and reports a missing one honestly", async () => {
    const created = await repo.createSession(await inputFor("USA"));
    await repo.deleteSession(created.id);

    expect(await repo.getSession(created.id)).toBeNull();
    await expect(repo.deleteSession(created.id)).rejects.toBeInstanceOf(RepositoryError);
  });
});

describe("price editing", () => {
  it("does not rewrite the snapshot of a saved session", async () => {
    const created = await repo.createSession(await inputFor("ID"));
    const growth = (await guideFor("ID")).packages.find((product) => product.name === "Growth")!;

    await repo.updatePackage(growth.id, { priceAmount: 4000000 });

    const reopened = await repo.getSession(created.id);
    expect(reopened?.snapshot.recommendedPackage?.priceAmount).toBe(3500000);

    await repo.updatePackage(growth.id, { priceAmount: 3500000 });
  });

  it("does not touch niche-specific rows when a base price changes", async () => {
    const guide = await guideFor("USA");
    const starter = guide.packages.find((product) => product.name === "Starter")!;
    const lawFirmRow = guide.nichePriceRows.find(
      (row) => row.nicheLabel === "Law Firm" && row.packageId === starter.id,
    )!;

    await repo.updatePackage(starter.id, { priceAmount: 450 });

    const refreshed = (await guideFor("USA")).nichePriceRows.find(
      (row) => row.id === lawFirmRow.id,
    );
    expect(refreshed?.priceAmount).toBe(750);

    await repo.updatePackage(starter.id, { priceAmount: 400 });
  });

  it("keeps exactly one recommended package per market", async () => {
    const premium = (await guideFor("ID")).packages.find((product) => product.name === "Premium")!;

    await repo.updatePackage(premium.id, { isRecommended: true });

    const refreshed = await guideFor("ID");
    expect(
      refreshed.packages.filter((product) => product.isRecommended).map((product) => product.name),
    ).toEqual(["Premium"]);

    const growth = refreshed.packages.find((product) => product.name === "Growth")!;
    await repo.updatePackage(growth.id, { isRecommended: true });
  });
});
describe("guide data editing", () => {
  it("updates a niche price row independently of the package price", async () => {
    const guide = await guideFor("AU");
    const row = guide.nichePriceRows.find((entry) => entry.nicheLabel === "HVAC")!;

    const updated = await repo.updateNichePriceRow(row.id, 750);
    expect(updated.priceAmount).toBe(750);

    const product = guide.packages.find((entry) => entry.id === row.packageId)!;
    expect(product.priceAmount).toBe(700);

    await repo.updateNichePriceRow(row.id, 700);
  });

  it("updates a schedule block without touching session snapshots", async () => {
    const created = await repo.createSession(await inputFor("USA"));
    const schedule = (await guideFor("USA")).schedules[0];

    await repo.updateSchedule(schedule.id, {
      startTimeWib: "20:45",
      cityLabels: ["Miami, Florida"],
      priorityLabels: ["Med spa"],
    });

    expect((await guideFor("USA")).schedules[0].startTimeWib).toBe("20:45");

    const snapshot = await repo.getSession(created.id);
    expect(snapshot?.snapshot.schedule?.startTimeWib).toBe("21:00");

    await repo.updateSchedule(schedule.id, {
      startTimeWib: "21:00",
      priorityLabels: schedule.priorityLabels,
    });
  });

  it("adds, edits and removes a child label", async () => {
    const category = (await guideFor("ID")).nicheCategories[0];
    const created = await repo.createNicheService(category.id, "Uji label");

    const updated = await repo.updateNicheService(created.id, "Uji label baru");
    expect(updated.name).toBe("Uji label baru");

    await repo.deleteNicheService(created.id);
    expect((await guideFor("ID")).nicheCategories[0].services.map((service) => service.name)).not.toContain(
      "Uji label baru",
    );
  });

  it("adds and removes an objection with its response", async () => {
    const guide = await guideFor("AU");
    await repo.createGuideItem("objections", guide.market.id, {
      text: "Kirim proposal dulu.",
      secondaryText: "Ask for the best email address and send it the same day.",
    });

    const withObjection = await guideFor("AU");
    expect(withObjection.objections).toHaveLength(4);

    const added = withObjection.objections.find(
      (objection) => objection.objectionText === "Kirim proposal dulu.",
    )!;
    await repo.updateGuideItem("objections", added.id, {
      text: "Kirim proposal dulu.",
      secondaryText: "Send it the same day.",
    });
    await repo.deleteGuideItem("objections", added.id);

    expect((await guideFor("AU")).objections).toHaveLength(3);
  });
});