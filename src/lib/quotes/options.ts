/**
 * Server-only option loading for the Quote Builder form.
 *
 * A quotation may only use a package from the lead's own market, so the options
 * are built as `lead -> its market's packages` here, from the Pricing Library.
 * Nothing in this module is a second price catalog: the amounts are the stored
 * `packages.price_amount` values.
 */

import { listMarketGuides } from "@/lib/guides/repository";
import { listLeads } from "@/lib/leads/repository";
import type { MarketGuide } from "@/lib/guides/types";
import type { QuoteLeadOption, QuotePackageOption } from "./types";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

function packagesOf(guide: MarketGuide | undefined): QuotePackageOption[] {
  if (!guide) return [];
  return guide.packages
    .filter((product) => product.isActive)
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
    .map((product) => ({
      id: product.id,
      name: product.name,
      priceAmount: product.priceAmount,
      isStartingPrice: product.isStartingPrice,
      timeline: product.timeline,
      features: product.features
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((feature) => feature.featureText),
      isRecommended: product.isRecommended,
    }));
}

/**
 * Every active lead with the packages of its market. Pagination is bounded so a
 * very large lead list cannot make this query unbounded.
 */
export async function loadQuoteLeadOptions(): Promise<QuoteLeadOption[]> {
  const [guides, firstPage] = await Promise.all([
    listMarketGuides(),
    listLeads({ pageSize: PAGE_SIZE, sort: "name" }),
  ]);

  const guidesByMarketId = new Map(guides.map((guide) => [guide.market.id, guide]));
  const leads = [...firstPage.leads];
  const totalPages = Math.min(Math.ceil(firstPage.total / firstPage.pageSize), MAX_PAGES);

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await listLeads({ pageSize: PAGE_SIZE, sort: "name", page });
    leads.push(...next.leads);
  }

  return leads.map((lead) => ({
    id: lead.id,
    businessName: lead.businessName,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    city: lead.city,
    marketId: lead.marketId,
    marketCode: lead.marketCode,
    marketName: lead.marketName,
    currencyCode: lead.currencyCode,
    currencyLabel: lead.currencyLabel,
    nicheName: lead.nicheName,
    packages: packagesOf(guidesByMarketId.get(lead.marketId)),
  }));
}

/** Packages for one market, used when only a market id is known. */
export async function loadMarketPackageOptions(marketId: string): Promise<QuotePackageOption[]> {
  const guides = await listMarketGuides();
  return packagesOf(guides.find((guide) => guide.market.id === marketId));
}