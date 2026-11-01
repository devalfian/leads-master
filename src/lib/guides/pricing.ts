/**
 * Pricing rules.
 *
 * Kept in one place so the pricing library, the session planner and the saved
 * session snapshot cannot disagree about which price applies.
 *
 * Source-guide rule: a niche-specific price is used only when that market's
 * guide supplies an explicit row for that niche and package. Otherwise the
 * package's standard price is shown and labelled as a standard reference — a
 * niche price is never inferred or interpolated.
 */

import type {
  MarketGuide,
  MarketSchedule,
  NicheCategory,
  NichePriceGroup,
  NichePriceRow,
  Package,
} from "./types";

/** Case/whitespace-insensitive comparison of source labels. */
export function normaliseLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function activeSchedules(guide: MarketGuide): MarketSchedule[] {
  return guide.schedules.filter((schedule) => schedule.isActive);
}

export function activeCategories(guide: MarketGuide): NicheCategory[] {
  return guide.nicheCategories.filter((category) => category.isActive);
}

export function activePackages(guide: MarketGuide): Package[] {
  return guide.packages.filter((product) => product.isActive);
}

/**
 * The recommended package is a market setting (`markets.recommended_package_id`),
 * not a guess. The package-level `is_recommended` flag is only a fallback for a
 * market whose setting is missing.
 */
export function getRecommendedPackage(guide: MarketGuide): Package | null {
  const byMarketSetting = guide.packages.find(
    (product) => product.id === guide.market.recommendedPackageId,
  );
  if (byMarketSetting) return byMarketSetting;
  return guide.packages.find((product) => product.isRecommended) ?? null;
}

export function getPackageById(packages: Package[], packageId: string | null): Package | null {
  if (!packageId) return null;
  return packages.find((product) => product.id === packageId) ?? null;
}

function nicheRowMatchesCategory(row: NichePriceRow, category: NicheCategory): boolean {
  if (row.nicheCategoryId === category.id) return true;
  return normaliseLabel(row.nicheLabel) === normaliseLabel(category.name);
}

function toGroups(rows: NichePriceRow[], packages: Package[]): NichePriceGroup[] {
  const byLabel = new Map<string, NichePriceGroup>();

  for (const row of rows) {
    const product = getPackageById(packages, row.packageId);
    if (!product) continue;

    const group =
      byLabel.get(row.nicheLabel) ??
      ({
        label: row.nicheLabel,
        sourceOrder: row.sourceOrder,
        prices: [],
      } satisfies NichePriceGroup);

    if (!group.prices.some((price) => price.packageId === product.id)) {
      group.prices.push({
        packageId: product.id,
        packageName: product.name,
        priceAmount: row.priceAmount,
      });
    }
    byLabel.set(row.nicheLabel, group);
  }

  const productOrder = new Map(packages.map((product, index) => [product.id, index]));
  return [...byLabel.values()]
    .sort((a, b) => a.sourceOrder - b.sourceOrder || a.label.localeCompare(b.label))
    .map((group) => ({
      ...group,
      prices: [...group.prices].sort(
        (a, b) => (productOrder.get(a.packageId) ?? 0) - (productOrder.get(b.packageId) ?? 0),
      ),
    }));
}

/** Every supplied niche-price row for the market, grouped by source label. */
export function groupNichePriceRows(rows: NichePriceRow[], packages: Package[]): NichePriceGroup[] {
  return toGroups(rows, packages);
}

/** Rows that the source guide supplies for one niche category. */
export function resolveNichePriceGroups(
  category: NicheCategory | null,
  rows: NichePriceRow[],
  packages: Package[],
): NichePriceGroup[] {
  if (!category) return [];
  return toGroups(
    rows.filter((row) => nicheRowMatchesCategory(row, category)),
    packages,
  );
}

export type SessionPricing = {
  recommendedPackage: Package | null;
  /** The market's standard price for the recommended package. */
  standardAmount: number | null;
  /** The price to present for this session. */
  amount: number | null;
  priceSource: "niche" | "standard" | "unconfigured";
  nicheLabels: string[];
  /** True when matched source rows disagree, in which case the standard price is shown. */
  priceConflict: boolean;
};

/**
 * Chooses the price for a session: the supplied niche row wins over the package
 * base price, but only when it exists for this market, this niche and this
 * package.
 */
export function resolveSessionPricing(
  guide: MarketGuide,
  category: NicheCategory | null,
): SessionPricing {
  const recommendedPackage = getRecommendedPackage(guide);
  if (!recommendedPackage) {
    return {
      recommendedPackage: null,
      standardAmount: null,
      amount: null,
      priceSource: "unconfigured",
      nicheLabels: [],
      priceConflict: false,
    };
  }

  const groups = resolveNichePriceGroups(category, guide.nichePriceRows, guide.packages);
  const supplied = groups
    .map((group) => group.prices.find((price) => price.packageId === recommendedPackage.id))
    .filter((price): price is NonNullable<typeof price> => Boolean(price));

  if (supplied.length === 0) {
    return {
      recommendedPackage,
      standardAmount: recommendedPackage.priceAmount,
      amount: recommendedPackage.priceAmount,
      priceSource: "standard",
      nicheLabels: [],
      priceConflict: false,
    };
  }

  const distinctAmounts = new Set(supplied.map((price) => price.priceAmount));
  if (distinctAmounts.size > 1) {
    return {
      recommendedPackage,
      standardAmount: recommendedPackage.priceAmount,
      amount: recommendedPackage.priceAmount,
      priceSource: "standard",
      nicheLabels: groups.map((group) => group.label),
      priceConflict: true,
    };
  }

  return {
    recommendedPackage,
    standardAmount: recommendedPackage.priceAmount,
    amount: supplied[0].priceAmount,
    priceSource: "niche",
    nicheLabels: groups.map((group) => group.label),
    priceConflict: false,
  };
}

const PAGE_COUNT_PATTERN =
  /(?:hingga|up to)\s+\d+(?:\s*[–-]\s*\d+)?\s+(?:halaman|pages)|\b\d+\+\s+(?:halaman|pages)/i;

/**
 * Returns the supplied "included pages" line when the guide states one
 * ("Hingga 5 halaman.", "Up to 3 pages.", "20+ halaman."). The feature text is
 * returned verbatim — no page count is derived when the guide omits it.
 */
export function findPageCountFeature(features: string[]): string | null {
  return features.find((feature) => PAGE_COUNT_PATTERN.test(feature)) ?? null;
}