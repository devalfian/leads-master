import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Phase 2 regression coverage against a real database built from the migrations:
 * the new Callbook context fields, backward compatibility with rows created before
 * they existed, the snapshot round-trip, and the pricing context resolved from the
 * Phase 1 guide data (including US specialty rows).
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-callbook-context-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "context.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const repo = await import("./repository");
const { loadCallbookPricingContext } = await import("./context");
const { loadCallbookMarketOptions } = await import("./guide-options");
const guidesRepo = await import("@/lib/guides/repository");
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

async function guideFor(code: string) {
  const guides = await guidesRepo.listMarketGuides();
  return guides.find((guide) => guide.market.code === code)!;
}

describe("callbook market and niche context", () => {
  it("stores the market, niche and language from the guide data", async () => {
    const usa = await guideFor("USA");
    const medSpa = usa.nicheCategories.find((category) => category.name === "Med Spa & Aesthetic")!;

    const callbook = await repo.createCallbook({
      title: "USA med spa context",
      primaryGoal: "book_meeting",
      marketId: usa.market.id,
      nicheCategoryId: medSpa.id,
      language: "en",
      internalNotes: "Only call between 21:00 and 23:00 WIB.",
    });

    expect(callbook.marketId).toBe(usa.market.id);
    expect(callbook.marketCode).toBe("USA");
    expect(callbook.marketName).toBe("United States");
    expect(callbook.nicheCategoryId).toBe(medSpa.id);
    expect(callbook.nicheName).toBe("Med Spa & Aesthetic");
    expect(callbook.language).toBe("en");
    expect(callbook.internalNotes).toContain("21:00");

    const reopened = await repo.getCallbook(callbook.id);
    expect(reopened?.nicheName).toBe("Med Spa & Aesthetic");
  });

  it("rejects a niche that belongs to another market", async () => {
    const usa = await guideFor("USA");
    const id = await guideFor("ID");
    const medSpa = usa.nicheCategories.find((category) => category.name === "Med Spa & Aesthetic")!;

    await expect(
      repo.createCallbook({
        title: "Cross-market niche",
        primaryGoal: "book_meeting",
        marketId: id.market.id,
        nicheCategoryId: medSpa.id,
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });

  it("clears the niche when the market changes", async () => {
    const usa = await guideFor("USA");
    const au = await guideFor("AU");
    const dental = usa.nicheCategories.find(
      (category) => category.name === "Dental & Orthodontics",
    )!;

    const callbook = await repo.createCallbook({
      title: "Switch market",
      primaryGoal: "book_meeting",
      marketId: usa.market.id,
      nicheCategoryId: dental.id,
    });

    const updated = await repo.updateCallbookMeta(callbook.id, { marketId: au.market.id });
    expect(updated.marketCode).toBe("AU");
    expect(updated.nicheCategoryId).toBeNull();
    expect(updated.nicheName).toBeNull();
  });

  it("duplicates the context without sharing rows", async () => {
    const au = await guideFor("AU");
    const plumbing = au.nicheCategories.find((category) => category.name === "Plumbing")!;
    const source = await repo.createCallbook({
      title: "AU plumbing copy source",
      primaryGoal: "book_meeting",
      marketId: au.market.id,
      nicheCategoryId: plumbing.id,
      language: "en",
    });

    const copy = await repo.duplicateCallbook(source.id);
    expect(copy.marketId).toBe(au.market.id);
    expect(copy.nicheCategoryId).toBe(plumbing.id);
    expect(copy.language).toBe("en");
    expect(copy.id).not.toBe(source.id);

    const sourceIds = new Set(source.graph.nodes.map((node) => node.id));
    for (const node of copy.graph.nodes) expect(sourceIds.has(node.id)).toBe(false);
  });
});
describe("backward compatibility", () => {
  it("reads a callbook row created before the context columns existed", async () => {
    const db = await createLocalSqliteExecutor();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO callbooks (id, title, description, target_audience, primary_goal, status,
                              start_node_id, published_version, created_at, updated_at)
       VALUES (?, ?, '', '', 'book_meeting', 'draft', NULL, 0, ?, ?)`,
      ["legacy-callbook", "Legacy callbook", now, now],
    );

    const legacy = await repo.getCallbook("legacy-callbook");
    expect(legacy).not.toBeNull();
    expect(legacy?.marketId).toBeNull();
    expect(legacy?.nicheCategoryId).toBeNull();
    expect(legacy?.language).toBeNull();
    expect(legacy?.internalNotes).toBe("");
    expect(legacy?.marketName).toBeNull();
    expect(legacy?.graph.nodes).toEqual([]);
  });

  it("keeps a step's context fields across save and reload", async () => {
    const callbook = await repo.createCallbook({
      title: "Step context round trip",
      primaryGoal: "book_meeting",
    });
    const opening = callbook.graph.nodes[0]!;

    const saved = await repo.saveCallbookGraph(callbook.id, {
      startNodeId: opening.id,
      nodes: [
        {
          ...opening,
          title: "Opening",
          script: "Hi, is this the owner?",
          stepType: "qualification",
          purpose: "Confirm we are speaking to the decision maker.",
          talkingPoints: ["Keep it under 10 seconds", "Do not pitch yet"],
          branches: [
            {
              id: "context-branch-1",
              label: "Yes, speaking",
              examplePhrases: ["Yes, that's me."],
              nextNodeId: null,
              sortOrder: 0,
            },
          ],
        },
      ],
    });
    // The save itself must succeed even while the draft is incomplete.
    expect(saved.callbook.graph.nodes).toHaveLength(1);

    const reopened = await repo.getCallbook(callbook.id);
    const node = reopened!.graph.nodes[0]!;
    expect(node.stepType).toBe("qualification");
    expect(node.purpose).toContain("decision maker");
    expect(node.talkingPoints).toHaveLength(2);

    // Explicitly clearing the optional context must persist too.
    const cleared = await repo.saveCallbookGraph(callbook.id, {
      startNodeId: opening.id,
      nodes: [{ ...node, stepType: null, purpose: null, talkingPoints: [] }],
    });
    expect(cleared.callbook.graph.nodes[0]!.stepType).toBeNull();
    expect(cleared.callbook.graph.nodes[0]!.talkingPoints).toEqual([]);
  });

  it("carries the step context into a published snapshot", async () => {
    const callbook = await repo.createCallbook({
      title: "Snapshot context",
      primaryGoal: "book_meeting",
    });
    const opening = callbook.graph.nodes[0]!;
    const outcome = {
      id: "snapshot-outcome-1",
      type: "outcome" as const,
      title: "Not interested",
      script: "Thanks for your time.",
      internalNote: null,
      position: { x: 400, y: 120 },
      outcomeKey: "not_interested",
      branches: [],
      sortOrder: 1,
      stepType: "end" as const,
      purpose: null,
      talkingPoints: [],
    };

    await repo.saveCallbookGraph(callbook.id, {
      startNodeId: opening.id,
      nodes: [
        {
          ...opening,
          title: "Opening",
          script: "Hi there.",
          stepType: "opening",
          purpose: "Start the conversation.",
          talkingPoints: ["Smile"],
          branches: [
            {
              id: "snapshot-branch-1",
              label: "No thanks",
              examplePhrases: [],
              nextNodeId: outcome.id,
              sortOrder: 0,
            },
          ],
        },
        outcome,
      ],
    });

    const published = await repo.publishCallbook(callbook.id);
    expect(published.version).toBe(1);

    const session = await repo.startCallSession(callbook.id);
    const current = session.snapshot.nodes.find((node) => node.id === session.currentNodeId)!;
    expect(current.stepType).toBe("opening");
    expect(current.purpose).toBe("Start the conversation.");
    expect(current.talkingPoints).toEqual(["Smile"]);
  });
});
describe("pricing context", () => {
  it("uses the supplied US specialty rows for a law-firm callbook", async () => {
    const usa = await guideFor("USA");
    const lawFirm = usa.nicheCategories.find(
      (category) => category.name === "Law Firm & Professional",
    )!;

    const callbook = await repo.createCallbook({
      title: "US law firm pricing",
      primaryGoal: "book_meeting",
      marketId: usa.market.id,
      nicheCategoryId: lawFirm.id,
    });

    const context = await loadCallbookPricingContext(callbook);
    expect(context.source).toBe("guide");
    expect(context.market?.currencyCode).toBe("USD");
    expect(context.niche.name).toBe("Law Firm & Professional");
    expect(context.recommendedPackageId).toBe("pkg_usa_growth");

    const lawFirmRow = context.specialtyRows.find((row) => row.label === "Law Firm")!;
    expect(lawFirmRow.prices.map((price) => price.priceAmount)).toEqual([750, 1500, 3000]);

    const growth = context.packages.find((product) => product.name === "Growth")!;
    expect(growth.priceAmount).toBe(750);
  });

  it("reports the supplied row label rather than inventing a niche price", async () => {
    const au = await guideFor("AU");
    const cleaning = au.nicheCategories.find((category) => category.name === "Cleaning")!;

    const callbook = await repo.createCallbook({
      title: "AU cleaning pricing",
      primaryGoal: "book_meeting",
      marketId: au.market.id,
      nicheCategoryId: cleaning.id,
    });

    const context = await loadCallbookPricingContext(callbook);
    // The guide labels this row "Cleaning Company"; matching is link/label based.
    expect(context.specialtyRows.map((row) => row.label)).toEqual(["Cleaning Company"]);
    expect(context.packages.find((product) => product.name === "Professional")?.priceAmount).toBe(
      1200,
    );
  });

  it("prefers the saved session snapshot when the market and niche match", async () => {
    const usa = await guideFor("USA");
    const lawFirm = usa.nicheCategories.find(
      (category) => category.name === "Law Firm & Professional",
    )!;
    const callbook = await repo.createCallbook({
      title: "US law firm from session",
      primaryGoal: "book_meeting",
      marketId: usa.market.id,
      nicheCategoryId: lawFirm.id,
    });

    const session = await guidesRepo.createSession({
      marketCode: "USA",
      scheduleId: "sched_usa_2",
      nicheSlug: lawFirm.slug,
      sessionDate: "2026-11-20",
      title: "Atlanta law firms",
      objective: "Memahami kebutuhan dan kondisi website saat ini.",
      customNotes: "",
    });

    const context = await loadCallbookPricingContext(callbook, session.id);
    expect(context.source).toBe("session");
    expect(context.sourceLabel).toContain("Session snapshot");
    expect(context.recommendedPackageId).toBe("pkg_usa_growth");
    expect(context.niche.name).toBe("Law Firm & Professional");
    expect(context.specialtyRows.map((row) => row.label)).toEqual([
      "Law Firm",
      "Accounting / Consulting",
    ]);

    // The frozen snapshot price wins over later master data.
    await guidesRepo.updatePackage("pkg_usa_growth", { priceAmount: 800 });
    const frozen = await loadCallbookPricingContext(callbook, session.id);
    expect(frozen.packages.find((product) => product.id === "pkg_usa_growth")?.priceAmount).toBe(750);

    const current = await loadCallbookPricingContext(callbook);
    expect(current.source).toBe("guide");
    expect(current.packages.find((product) => product.id === "pkg_usa_growth")?.priceAmount).toBe(800);

    await guidesRepo.updatePackage("pkg_usa_growth", { priceAmount: 750 });
  });

  it("ignores a session from another market and says so", async () => {
    const au = await guideFor("AU");
    const plumbing = au.nicheCategories.find((category) => category.name === "Plumbing")!;
    const callbook = await repo.createCallbook({
      title: "AU plumbing session mismatch",
      primaryGoal: "book_meeting",
      marketId: au.market.id,
      nicheCategoryId: plumbing.id,
    });

    const id = await guideFor("ID");
    const session = await guidesRepo.createSession({
      marketCode: "ID",
      scheduleId: "sched_id_1",
      nicheSlug: id.nicheCategories[0]!.slug,
      sessionDate: "2026-11-21",
      title: "Northbay block",
      objective: "Menawarkan solusi yang relevan.",
      customNotes: "",
    });

    const context = await loadCallbookPricingContext(callbook, session.id);
    expect(context.source).toBe("guide");
    expect(context.note).toContain("ignored");
    expect(context.market?.code).toBe("AU");
  });

  it("explains an unset market instead of showing prices", async () => {
    const callbook = await repo.createCallbook({
      title: "No market callbook",
      primaryGoal: "book_meeting",
    });
    const context = await loadCallbookPricingContext(callbook);
    expect(context.source).toBe("none");
    expect(context.packages).toEqual([]);
    expect(context.note).toBeTruthy();
  });
});

describe("market options", () => {
  it("builds the selectors from the guide data", async () => {
    const options = await loadCallbookMarketOptions();
    expect(options.map((option) => option.code)).toEqual(["ID", "AU", "USA"]);
    const usa = options.find((option) => option.code === "USA")!;
    expect(usa.currencyCode).toBe("USD");
    expect(usa.niches.map((niche) => niche.name)).toContain("Med Spa & Aesthetic");
  });
});
describe("API contract", () => {
  const jsonRequest = (url: string, method: string, body: unknown) =>
    new Request(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const params = <T extends Record<string, string>>(values: T) => ({
    params: Promise.resolve(values),
  });

  it("creates a callbook with market and niche through the create route", async () => {
    const { POST } = await import("@/app/api/callbooks/route");
    const usa = await guideFor("USA");
    const roofing = usa.nicheCategories.find((category) => category.name === "Roofing")!;

    const response = await POST(
      jsonRequest("http://test/api/callbooks", "POST", {
        title: "API create with context",
        primaryGoal: "book_meeting",
        marketId: usa.market.id,
        nicheCategoryId: roofing.id,
        language: "en",
      }),
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.data.callbook.marketId).toBe(usa.market.id);
    expect(payload.data.callbook.marketCode).toBe("USA");
    expect(payload.data.callbook.nicheName).toBe("Roofing");
    expect(payload.data.callbook.language).toBe("en");
  });

  it("accepts market and niche through the meta route", async () => {
    const { PATCH } = await import("@/app/api/callbooks/[id]/route");
    const usa = await guideFor("USA");
    const roofing = usa.nicheCategories.find((category) => category.name === "Roofing")!;
    const callbook = await repo.createCallbook({
      title: "API meta context",
      primaryGoal: "book_meeting",
    });

    const response = await PATCH(
      jsonRequest(`http://test/api/callbooks/${callbook.id}`, "PATCH", {
        marketId: usa.market.id,
        nicheCategoryId: roofing.id,
        language: "en",
        internalNotes: "Prep note",
      }),
      params({ id: callbook.id }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.callbook.marketCode).toBe("USA");
    expect(payload.data.callbook.nicheName).toBe("Roofing");
    expect(payload.data.callbook.language).toBe("en");
    expect(payload.data.callbook.internalNotes).toBe("Prep note");
  });

  it("rejects a niche from another market with a useful message", async () => {
    const { PATCH } = await import("@/app/api/callbooks/[id]/route");
    const usa = await guideFor("USA");
    const id = await guideFor("ID");
    const medSpa = usa.nicheCategories.find(
      (category) => category.name === "Med Spa & Aesthetic",
    )!;
    const callbook = await repo.createCallbook({
      title: "API wrong niche",
      primaryGoal: "book_meeting",
      marketId: id.market.id,
    });

    const response = await PATCH(
      jsonRequest(`http://test/api/callbooks/${callbook.id}`, "PATCH", {
        nicheCategoryId: medSpa.id,
      }),
      params({ id: callbook.id }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.message).toContain("different market");
  });

  it("still saves a graph payload that predates the step context fields", async () => {
    const { PUT } = await import("@/app/api/callbooks/[id]/graph/route");
    const callbook = await repo.createCallbook({
      title: "API legacy graph",
      primaryGoal: "book_meeting",
    });
    const opening = callbook.graph.nodes[0]!;

    const response = await PUT(
      jsonRequest(`http://test/api/callbooks/${callbook.id}/graph`, "PUT", {
        graph: {
          startNodeId: opening.id,
          nodes: [
            {
              id: opening.id,
              type: "message",
              title: "Opening",
              script: "Hi there.",
              internalNote: null,
              position: { x: 80, y: 120 },
              outcomeKey: null,
              branches: [],
              sortOrder: 0,
            },
          ],
        },
      }),
      params({ id: callbook.id }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    const node = payload.data.callbook.graph.nodes[0]!;
    expect(node.stepType).toBeNull();
    expect(node.purpose).toBeNull();
    expect(node.talkingPoints).toEqual([]);
  });
});