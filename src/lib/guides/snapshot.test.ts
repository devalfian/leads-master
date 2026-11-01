import { describe, expect, it } from "vitest";
import { buildSnapshot, parseSnapshot, serializeSnapshot, snapshotPrice } from "./snapshot";
import type { MarketGuide, MarketSchedule, NicheCategory, Package } from "./types";

const schedule: MarketSchedule = {
  id: "sched_usa_1",
  marketId: "market_usa",
  scheduleCode: "USA-1",
  title: "Miami, Florida",
  startTimeWib: "21:00",
  endTimeWib: "21:30",
  localTimeLabel: "10:00–11:00",
  timezoneLabel: "Local / ET",
  cityLabels: ["Miami, Florida"],
  priorityLabels: ["Med spa", "Cosmetic dentistry"],
  scheduleNote: null,
  sortOrder: 1,
  isActive: true,
  createdAt: "2026-10-28T00:00:00.000Z",
  updatedAt: "2026-10-28T00:00:00.000Z",
};

const category: NicheCategory = {
  id: "niche_usa_law_firm",
  marketId: "market_usa",
  slug: "law-firm-professional",
  name: "Law Firm & Professional",
  sortOrder: 10,
  isActive: true,
  services: [
    { id: "s1", nicheCategoryId: "niche_usa_law_firm", name: "Family law", sortOrder: 1 },
  ],
};

function makePackage(
  overrides: Partial<Package> & Pick<Package, "id" | "slug" | "name" | "priceAmount">,
): Package {
  return {
    marketId: "market_usa",
    isStartingPrice: false,
    timeline: "10–14 business days",
    isRecommended: false,
    displayOrder: 1,
    isActive: true,
    features: [],
    createdAt: "2026-10-28T00:00:00.000Z",
    updatedAt: "2026-10-28T00:00:00.000Z",
    ...overrides,
  };
}

function makeGuide(): MarketGuide {
  return {
    market: {
      id: "market_usa",
      code: "USA",
      name: "United States",
      currencyCode: "USD",
      currencyLabel: "US$",
      recommendedPackageId: "pkg_usa_growth",
      targetPriceAmount: 750,
      targetPriceIsMinimum: true,
      timezoneNote: "Jadwal waktu dalam WIB. Berlaku area sampai 1 November 2026.",
      scheduleNoteReviewRequired: true,
      sortOrder: 3,
      isActive: true,
      createdAt: "2026-10-28T00:00:00.000Z",
      updatedAt: "2026-10-28T00:00:00.000Z",
    },
    schedules: [schedule],
    packages: [
      makePackage({
        id: "pkg_usa_starter",
        slug: "starter",
        name: "Starter",
        priceAmount: 400,
        features: [
          { id: "f1", packageId: "pkg_usa_starter", featureText: "Up to 3 pages.", sortOrder: 1 },
        ],
      }),
      makePackage({
        id: "pkg_usa_growth",
        slug: "growth",
        name: "Growth",
        priceAmount: 750,
        displayOrder: 2,
        isRecommended: true,
        features: [
          { id: "f2", packageId: "pkg_usa_growth", featureText: "Up to 5 pages.", sortOrder: 1 },
        ],
      }),
    ],
    nicheCategories: [category],
    nichePriceRows: [
      {
        id: "row-1",
        marketId: "market_usa",
        nicheCategoryId: "niche_usa_law_firm",
        nicheLabel: "Law Firm",
        packageId: "pkg_usa_growth",
        priceAmount: 1500,
        sourceOrder: 11,
      },
    ],
    callObjectives: [
      {
        id: "g1",
        marketId: "market_usa",
        kind: "call_objective",
        goalText: "Berbicara dengan owner atau decision maker.",
        sortOrder: 1,
      },
    ],
    sessionGoals: [],
    checklist: [
      { id: "c1", marketId: "market_usa", itemText: "Perkenalan singkat.", sortOrder: 1 },
    ],
    objections: [
      {
        id: "o1",
        marketId: "market_usa",
        objectionText: "We already have a website.",
        suggestedResponse: "Ask whether they want to improve the design.",
        sortOrder: 1,
      },
    ],
    tools: [
      {
        id: "t1",
        marketId: "market_usa",
        toolName: "Google Maps",
        toolDescription: "find local businesses.",
        sortOrder: 1,
      },
    ],
  };
}

function build(guide = makeGuide()) {
  return buildSnapshot({
    guide,
    schedule,
    category,
    objective: "Berbicara dengan owner atau decision maker.",
    notes: "Call before lunch.",
    capturedAt: "2026-10-29T02:00:00.000Z",
  });
}
describe("session snapshot", () => {
  it("captures the market, schedule, niche and guide reference data", () => {
    const snapshot = build();
    expect(snapshot.market.code).toBe("USA");
    expect(snapshot.market.scheduleNoteReviewRequired).toBe(true);
    expect(snapshot.schedule?.startTimeWib).toBe("21:00");
    expect(snapshot.schedule?.localTimeLabel).toBe("10:00–11:00");
    expect(snapshot.niche).toEqual({
      slug: "law-firm-professional",
      name: "Law Firm & Professional",
      services: ["Family law"],
    });
    expect(snapshot.callObjectives).toEqual(["Berbicara dengan owner atau decision maker."]);
    expect(snapshot.checklist).toEqual(["Perkenalan singkat."]);
    expect(snapshot.objections[0].objectionText).toBe("We already have a website.");
    expect(snapshot.tools[0].toolName).toBe("Google Maps");
    expect(snapshot.notes).toBe("Call before lunch.");
  });

  it("stores the resolved specialty price next to the standard price", () => {
    const snapshot = build();
    expect(snapshot.priceSource).toBe("niche");
    expect(snapshot.recommendedPackage?.priceAmount).toBe(1500);
    expect(snapshot.recommendedPackage?.standardPriceAmount).toBe(750);
    expect(snapshotPrice(snapshot)).toBe(1500);
  });

  it("round-trips through the stored JSON", () => {
    const snapshot = build();
    expect(parseSnapshot(serializeSnapshot(snapshot))).toEqual(snapshot);
  });

  it("is unaffected by later edits to the source guide", () => {
    const guide = makeGuide();
    const snapshot = build(guide);
    guide.packages[1].priceAmount = 9_999;
    guide.nichePriceRows[0].priceAmount = 9_999;
    expect(snapshot.recommendedPackage?.priceAmount).toBe(1500);
    expect(snapshot.packages[1].priceAmount).toBe(750);
  });

  it("rejects unreadable or foreign snapshots", () => {
    expect(parseSnapshot("not json")).toBeNull();
    expect(parseSnapshot(JSON.stringify({ version: 2 }))).toBeNull();
    const snapshot = build();
    expect(parseSnapshot(JSON.stringify({ ...snapshot, priceSource: "guessed" }))).toBeNull();
  });
});