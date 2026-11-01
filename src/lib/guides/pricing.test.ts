import { describe, expect, it } from "vitest";
import {
  findPageCountFeature,
  getRecommendedPackage,
  groupNichePriceRows,
  normaliseLabel,
  resolveNichePriceGroups,
  resolveSessionPricing,
} from "./pricing";
import type { MarketGuide, NicheCategory, NichePriceRow, Package } from "./types";

function makePackage(
  overrides: Partial<Package> & Pick<Package, "id" | "slug" | "name">,
): Package {
  return {
    marketId: "m-usa",
    priceAmount: 0,
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

function makeCategory(
  overrides: Partial<NicheCategory> & Pick<NicheCategory, "id" | "name">,
): NicheCategory {
  return {
    marketId: "m-usa",
    slug: overrides.name.toLowerCase().replace(/\s+/g, "-"),
    sortOrder: 1,
    isActive: true,
    services: [],
    ...overrides,
  };
}

function makePriceRow(
  overrides: Partial<NichePriceRow> &
    Pick<NichePriceRow, "id" | "nicheLabel" | "packageId" | "priceAmount">,
): NichePriceRow {
  return {
    marketId: "m-usa",
    nicheCategoryId: null,
    sourceOrder: 1,
    ...overrides,
  };
}

const starter = makePackage({
  id: "p-starter",
  slug: "starter",
  name: "Starter",
  priceAmount: 400,
  displayOrder: 1,
});
const growth = makePackage({
  id: "p-growth",
  slug: "growth",
  name: "Growth",
  priceAmount: 750,
  displayOrder: 2,
});
const premium = makePackage({
  id: "p-premium",
  slug: "premium",
  name: "Premium",
  priceAmount: 1500,
  displayOrder: 3,
  timeline: "3–4 weeks",
});

const lawFirm = makeCategory({
  id: "c-law",
  name: "Law Firm & Professional",
  slug: "law-firm-professional",
  services: [
    { id: "s-1", nicheCategoryId: "c-law", name: "Family law", sortOrder: 1 },
    { id: "s-2", nicheCategoryId: "c-law", name: "Accounting firm", sortOrder: 2 },
  ],
});

const specialtyRows: NichePriceRow[] = [
  makePriceRow({
    id: "row-law-starter",
    nicheCategoryId: "c-law",
    nicheLabel: "Law Firm",
    packageId: "p-starter",
    priceAmount: 750,
    sourceOrder: 11,
  }),
  makePriceRow({
    id: "row-law-growth",
    nicheCategoryId: "c-law",
    nicheLabel: "Law Firm",
    packageId: "p-growth",
    priceAmount: 1500,
    sourceOrder: 11,
  }),
  makePriceRow({
    id: "row-law-premium",
    nicheCategoryId: "c-law",
    nicheLabel: "Law Firm",
    packageId: "p-premium",
    priceAmount: 3000,
    sourceOrder: 11,
  }),
  makePriceRow({
    id: "row-acct-growth",
    nicheCategoryId: "c-law",
    nicheLabel: "Accounting / Consulting",
    packageId: "p-growth",
    priceAmount: 1500,
    sourceOrder: 12,
  }),
];

function makeGuide(overrides: Partial<MarketGuide> = {}): MarketGuide {
  return {
    market: {
      id: "m-usa",
      code: "USA",
      name: "United States",
      currencyCode: "USD",
      currencyLabel: "US$",
      recommendedPackageId: "p-growth",
      targetPriceAmount: 750,
      targetPriceIsMinimum: true,
      timezoneNote: null,
      scheduleNoteReviewRequired: false,
      sortOrder: 3,
      isActive: true,
      createdAt: "2026-10-28T00:00:00.000Z",
      updatedAt: "2026-10-28T00:00:00.000Z",
    },
    schedules: [],
    packages: [starter, growth, premium],
    nicheCategories: [lawFirm],
    nichePriceRows: specialtyRows,
    callObjectives: [],
    sessionGoals: [],
    checklist: [],
    objections: [],
    tools: [],
    ...overrides,
  };
}
describe("recommended package", () => {
  it("comes from the market setting", () => {
    expect(getRecommendedPackage(makeGuide())?.id).toBe("p-growth");
  });

  it("falls back to the package flag only when the market setting is missing", () => {
    const guide = makeGuide({
      market: { ...makeGuide().market, recommendedPackageId: null },
      packages: [{ ...starter, isRecommended: true }, growth, premium],
    });
    expect(getRecommendedPackage(guide)?.id).toBe("p-starter");
  });

  it("returns null when nothing is configured", () => {
    const guide = makeGuide({
      market: { ...makeGuide().market, recommendedPackageId: null },
    });
    expect(getRecommendedPackage(guide)).toBeNull();
  });
});

describe("niche price rows", () => {
  it("groups source rows by label in source order", () => {
    const groups = groupNichePriceRows(specialtyRows, [starter, growth, premium]);
    expect(groups.map((group) => group.label)).toEqual(["Law Firm", "Accounting / Consulting"]);
    expect(groups[0].prices).toEqual([
      { packageId: "p-starter", packageName: "Starter", priceAmount: 750 },
      { packageId: "p-growth", packageName: "Growth", priceAmount: 1500 },
      { packageId: "p-premium", packageName: "Premium", priceAmount: 3000 },
    ]);
  });

  it("matches rows to a category by link or by label, ignoring case", () => {
    const byLabel = resolveNichePriceGroups(
      { ...lawFirm, id: "different-id", name: "  law   firm " },
      specialtyRows.filter((row) => row.nicheLabel === "Law Firm"),
      [starter, growth, premium],
    );
    expect(byLabel.map((group) => group.label)).toEqual(["Law Firm"]);

    const byId = resolveNichePriceGroups(lawFirm, specialtyRows, [starter, growth, premium]);
    expect(byId.map((group) => group.label)).toEqual(["Law Firm", "Accounting / Consulting"]);

    expect(normaliseLabel("  Law   Firm ")).toBe("law firm");
  });

  it("does not match a category whose label differs from the source row", () => {
    // "Law Firm & Professional" is the card title; the price row is "Law Firm".
    // Without the niche category link the row is not applied — nothing is guessed.
    const groups = resolveNichePriceGroups(
      { ...lawFirm, id: "unlinked" },
      specialtyRows.map((row) => ({ ...row, nicheCategoryId: null })),
      [starter, growth, premium],
    );
    expect(groups).toEqual([]);
  });

  it("returns no rows for an unspecified niche", () => {
    expect(resolveNichePriceGroups(null, specialtyRows, [starter, growth, premium])).toEqual([]);
  });
});

describe("session pricing", () => {
  it("uses the supplied specialty price when the rows agree", () => {
    const pricing = resolveSessionPricing(makeGuide(), lawFirm);
    expect(pricing.priceSource).toBe("niche");
    expect(pricing.amount).toBe(1500);
    expect(pricing.standardAmount).toBe(750);
    expect(pricing.nicheLabels).toEqual(["Law Firm", "Accounting / Consulting"]);
  });

  it("uses the standard price and labels it as such when no row is supplied", () => {
    const gardening = makeCategory({ id: "c-garden", name: "Gardening" });
    const pricing = resolveSessionPricing(makeGuide(), gardening);
    expect(pricing.priceSource).toBe("standard");
    expect(pricing.amount).toBe(750);
    expect(pricing.nicheLabels).toEqual([]);
  });

  it("never invents a niche price when the selected niche is unspecified", () => {
    const pricing = resolveSessionPricing(makeGuide(), null);
    expect(pricing.priceSource).toBe("standard");
    expect(pricing.amount).toBe(750);
  });

  it("falls back to the standard price when supplied rows disagree", () => {
    const rows = specialtyRows.map((row) =>
      row.id === "row-acct-growth" ? { ...row, priceAmount: 1_900 } : row,
    );
    const pricing = resolveSessionPricing(makeGuide({ nichePriceRows: rows }), lawFirm);
    expect(pricing.priceSource).toBe("standard");
    expect(pricing.amount).toBe(750);
    expect(pricing.priceConflict).toBe(true);
  });

  it("reports an unconfigured market instead of guessing a price", () => {
    const guide = makeGuide({
      market: { ...makeGuide().market, recommendedPackageId: null },
    });
    const pricing = resolveSessionPricing(guide, lawFirm);
    expect(pricing.priceSource).toBe("unconfigured");
    expect(pricing.amount).toBeNull();
    expect(pricing.recommendedPackage).toBeNull();
  });
});

describe("included pages", () => {
  it("returns the supplied page feature verbatim", () => {
    expect(findPageCountFeature(["Desain custom.", "Hingga 5 halaman.", "CMS."])).toBe(
      "Hingga 5 halaman.",
    );
    expect(findPageCountFeature(["Up to 3 pages.", "SEO."])).toBe("Up to 3 pages.");
    expect(findPageCountFeature(["Website hingga 8–10 halaman."])).toBe(
      "Website hingga 8–10 halaman.",
    );
    expect(findPageCountFeature(["20+ halaman."])).toBe("20+ halaman.");
  });

  it("returns null when the guide does not state a page count", () => {
    expect(findPageCountFeature(["SEO dasar.", "1 kali revisi."])).toBeNull();
  });
});