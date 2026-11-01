import { listMarketGuides } from "@/lib/guides/repository";
import type { CallbookMarketOption } from "./types";

/**
 * Builds the market/niche selector options for Callbook pages from the Phase 1
 * guide data. Server-only: the client receives plain options, never a query.
 */
export async function loadCallbookMarketOptions(): Promise<CallbookMarketOption[]> {
  const guides = await listMarketGuides();
  return guides.map((guide) => ({
    id: guide.market.id,
    code: guide.market.code,
    name: guide.market.name,
    currencyCode: guide.market.currencyCode,
    niches: guide.nicheCategories
      .filter((category) => category.isActive)
      .map((category) => ({ id: category.id, name: category.name })),
  }));
}