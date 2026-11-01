/**
 * Pricing context for a Callbook.
 *
 * Server-only: it reads the Phase 1 guide data (markets, niches, packages, niche
 * price rows) and, when a Session Planner session is supplied, the frozen snapshot
 * that session saved. No price is ever computed or hardcoded here — the values are
 * copied from those sources so the callbook and the pricing library cannot drift.
 *
 * The client receives a plain serialisable object, never a database handle.
 */

import { formatDateOnly } from "@/lib/guides/format";
import { getRecommendedPackage, resolveNichePriceGroups } from "@/lib/guides/pricing";
import { getMarketGuideById, getSession } from "@/lib/guides/repository";
import type { MarketGuide, SessionDetail } from "@/lib/guides/types";
import type { Callbook } from "./types";
import type { CallbookPricingContext, CallbookPricingPackage } from "./pricing-context-types";

export type { CallbookPricingContext, CallbookPricingPackage } from "./pricing-context-types";

const EMPTY_CONTEXT: CallbookPricingContext = {
  source: "none",
  sourceLabel: "No market connected",
  note: "This Callbook is not linked to a market yet. Set a market in the Callbook settings to show package references here.",
  market: null,
  niche: { id: null, name: null },
  packages: [],
  recommendedPackageId: null,
  specialtyRows: [],
};

function packagesFromGuide(guide: MarketGuide): CallbookPricingPackage[] {
  return guide.packages.map((product) => ({
    id: product.id,
    name: product.name,
    priceAmount: product.priceAmount,
    isStartingPrice: product.isStartingPrice,
    timeline: product.timeline,
    features: product.features.map((feature) => feature.featureText),
  }));
}

function packagesFromSnapshot(session: SessionDetail): CallbookPricingPackage[] {
  return session.snapshot.packages.map((product) => ({
    id: product.id,
    name: product.name,
    priceAmount: product.priceAmount,
    isStartingPrice: product.isStartingPrice,
    timeline: product.timeline,
    features: [...product.features],
  }));
}

function marketOf(guide: MarketGuide): CallbookPricingContext["market"] {
  return {
    id: guide.market.id,
    code: guide.market.code,
    name: guide.market.name,
    currencyCode: guide.market.currencyCode,
    currencyLabel: guide.market.currencyLabel,
  };
}

function nicheRowGroups(guide: MarketGuide, nicheName: string | null) {
  if (!nicheName) return [];
  const category = guide.nicheCategories.find((entry) => entry.name === nicheName) ?? null;
  if (!category) return [];
  return resolveNichePriceGroups(category, guide.nichePriceRows, guide.packages).map((group) => ({
    label: group.label,
    prices: group.prices.map((price) => ({ ...price })),
  }));
}
/**
 * Resolves the pricing references a Callbook should display.
 *
 * `plannerSessionId` comes from `?context=` when the user opened the callbook from
 * a saved session. The session snapshot wins **only** when it describes the same
 * market and the same niche, because mixing a frozen price for one niche with a
 * callbook for another would be misleading.
 */
export async function loadCallbookPricingContext(
  callbook: Callbook,
  plannerSessionId?: string | null,
): Promise<CallbookPricingContext> {
  if (!callbook.marketId) return EMPTY_CONTEXT;

  const guide = await getMarketGuideById(callbook.marketId);
  if (!guide) {
    return {
      ...EMPTY_CONTEXT,
      note: "The market linked to this Callbook no longer exists. Choose another market in the Callbook settings.",
    };
  }

  const niche = callbook.nicheCategoryId
    ? (guide.nicheCategories.find((category) => category.id === callbook.nicheCategoryId) ?? null)
    : null;

  if (plannerSessionId) {
    const session = await getSession(plannerSessionId);
    if (session) {
      const sameMarket = session.snapshot.market.code === guide.market.code;
      const sessionNicheName = session.snapshot.niche.name;
      const sameNiche = !niche || !sessionNicheName || sessionNicheName === niche.name;

      if (sameMarket && sameNiche) {
        return {
          source: "session",
          sourceLabel: `Session snapshot · ${formatDateOnly(session.sessionDate)}`,
          note: "Prices are the ones frozen in the saved session, not the current guide data.",
          market: marketOf(guide),
          niche: { id: niche?.id ?? null, name: niche?.name ?? sessionNicheName },
          packages: packagesFromSnapshot(session),
          recommendedPackageId: session.snapshot.recommendedPackage?.id ?? null,
          specialtyRows: session.snapshot.nichePriceGroups.map((group) => ({
            label: group.label,
            prices: group.prices.map((price) => ({ ...price })),
          })),
        };
      }

      // A saved session for a different market/niche must never be presented as this
      // callbook's quote. Fall back to current data and say why.
      const reason = !sameMarket
        ? `the saved session is for ${session.snapshot.market.name}`
        : `the saved session targets ${sessionNicheName ?? "another niche"}`;

      return {
        source: "guide",
        sourceLabel: "Current guide data",
        note: `Session context was ignored because ${reason}. These are the current ${guide.market.name} prices.`,
        market: marketOf(guide),
        niche: { id: niche?.id ?? null, name: niche?.name ?? null },
        packages: packagesFromGuide(guide),
        recommendedPackageId: getRecommendedPackage(guide)?.id ?? null,
        specialtyRows: nicheRowGroups(guide, niche?.name ?? null),
      };
    }
  }

  return {
    source: "guide",
    sourceLabel: "Current guide data",
    note: niche
      ? null
      : "No niche is set on this Callbook, so only the standard package prices are shown.",
    market: marketOf(guide),
    niche: { id: niche?.id ?? null, name: niche?.name ?? null },
    packages: packagesFromGuide(guide),
    recommendedPackageId: getRecommendedPackage(guide)?.id ?? null,
    specialtyRows: nicheRowGroups(guide, niche?.name ?? null),
  };
}