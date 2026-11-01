import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Phase 4 coverage against a real database built from the migrations.
 *
 * These tests prove the two rules that matter most for a quotation: the price
 * comes from the pricing database (never from the browser), and a saved quote
 * keeps its own amounts when the catalog changes later.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-quotes-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "quotes.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const quotesRepo = await import("./repository");
const leadsRepo = await import("@/lib/leads/repository");
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

async function guide(code: string) {
  const guides = await guidesRepo.listMarketGuides();
  const found = guides.find((entry) => entry.market.code === code);
  if (!found) throw new Error(`market ${code} missing from the seed`);
  return found;
}

function packageNamed(
  packages: Array<{ name: string; id: string; priceAmount: number }>,
  name: string,
) {
  const found = packages.find((product) => product.name === name);
  if (!found) throw new Error(`package ${name} missing from the seed`);
  return found;
}

async function makeLead(code: "ID" | "AU" | "USA", businessName = "Quote Test Co.") {
  const market = await guide(code);
  return leadsRepo.createLead({ businessName, marketId: market.market.id, city: "Test City" });
}

async function packageFor(code: "ID" | "AU" | "USA", name: string) {
  const market = await guide(code);
  return packageNamed(market.packages, name);
}

describe("quote creation", () => {
  it("prices the quotation from the pricing database, not the request", async () => {
    const lead = await makeLead("USA", "Miami Aesthetic Studio");
    const growth = await packageFor("USA", "Growth");

    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: growth.id,
      additionalLines: [],
      projectTitle: "Website",
    });

    expect(quote.status).toBe("draft");
    expect(quote.displayStatus).toBe("draft");
    expect(quote.currencyCode).toBe("USD");
    expect(quote.currencyLabel).toBe("US$");
    expect(quote.totalMinor).toBe(75_000);
    expect(quote.lineItems).toHaveLength(1);
    expect(quote.lineItems[0]?.description).toBe("Growth");
    expect(quote.packageSnapshot?.name).toBe("Growth");
    expect(quote.quoteNumber).toMatch(/^DLC-\d{4}-\d{4,}$/);
  });

  it("refuses a package that belongs to another market", async () => {
    const lead = await makeLead("USA", "Cross Market Co.");
    const australian = await packageFor("AU", "Essential");

    await expect(
      quotesRepo.createQuote({
        leadId: lead.id,
        primaryPackageId: australian.id,
        additionalLines: [],
        projectTitle: "Website",
      }),
    ).rejects.toMatchObject({ code: "invalid_reference" });
  });
});

describe("scope lines and discounts", () => {
  it("adds custom lines and a percentage discount exactly", async () => {
    const lead = await makeLead("USA", "Discount Co.");
    const growth = await packageFor("USA", "Growth");

    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: growth.id,
      additionalLines: [
        {
          lineType: "custom",
          description: "Booking form integration",
          quantity: 2,
          unitPriceMajor: 250.5,
        },
      ],
      projectTitle: "Website",
      discount: { type: "percent", percentBp: 1_000 },
    });

    expect(quote.subtotalMinor).toBe(75_000 + 2 * 25_050);
    expect(quote.discountAmountMinor).toBe(12_510);
    expect(quote.totalMinor).toBe(112_590);
    expect(quote.lineItems).toHaveLength(2);
    expect(quote.lineItems[1]?.lineType).toBe("custom");
  });

  it("rejects a discount larger than the subtotal", async () => {
    const lead = await makeLead("ID", "Diskon Co.");
    const essential = await packageFor("ID", "Essential");

    await expect(
      quotesRepo.createQuote({
        leadId: lead.id,
        primaryPackageId: essential.id,
        additionalLines: [],
        projectTitle: "Website",
        discount: { type: "fixed", amountMajor: 10_000_000 },
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("allocates a unique quote number per quotation", async () => {
    const lead = await makeLead("AU", "Numbering Co.");
    const essential = await packageFor("AU", "Essential");

    const first = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: essential.id,
      additionalLines: [],
      projectTitle: "First",
    });
    const second = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: essential.id,
      additionalLines: [],
      projectTitle: "Second",
    });

    expect(first.quoteNumber).not.toBe(second.quoteNumber);
    expect(first.id).not.toBe(second.id);
  });
});

describe("historical prices", () => {
  it("keeps a saved quote on its own prices when the catalog changes", async () => {
    const lead = await makeLead("ID", "Snapshot Co.");
    const growth = await packageFor("ID", "Growth");

    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: growth.id,
      additionalLines: [],
      projectTitle: "Website",
    });
    expect(quote.totalMinor).toBe(3_500_000);

    await guidesRepo.updatePackage(growth.id, { priceAmount: 5_000_000 });

    const reloaded = await quotesRepo.getQuote(quote.id);
    expect(reloaded?.totalMinor).toBe(3_500_000);
    expect(reloaded?.lineItems[0]?.unitPriceMinor).toBe(3_500_000);
    expect(reloaded?.priceDrift).toHaveLength(1);
    expect(reloaded?.priceDrift[0]?.savedUnitPriceMinor).toBe(3_500_000);
    expect(reloaded?.priceDrift[0]?.currentUnitPriceMinor).toBe(5_000_000);

    const refreshed = await quotesRepo.refreshQuotePrices(quote.id);
    expect(refreshed.totalMinor).toBe(5_000_000);
    expect(refreshed.priceDrift).toHaveLength(0);

    // Put the source guide back for the remaining tests.
    await guidesRepo.updatePackage(growth.id, { priceAmount: 3_500_000 });
  });

  it("editing a draft keeps the previously saved package price", async () => {
    const lead = await makeLead("AU", "Edit Co.");
    const professional = await packageFor("AU", "Professional");

    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: professional.id,
      additionalLines: [],
      projectTitle: "Website",
    });

    await guidesRepo.updatePackage(professional.id, { priceAmount: 1_500 });

    const updated = await quotesRepo.updateQuote(quote.id, {
      leadId: lead.id,
      primaryPackageId: professional.id,
      additionalLines: [],
      projectTitle: "Website, revised",
    });
    expect(updated.projectTitle).toBe("Website, revised");
    expect(updated.totalMinor).toBe(120_000);

    await guidesRepo.updatePackage(professional.id, { priceAmount: 1_200 });
  });
});

describe("lifecycle", () => {
  it("will not jump from draft to accepted", async () => {
    const lead = await makeLead("USA", "Lifecycle Co.");
    const starter = await packageFor("USA", "Starter");
    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: starter.id,
      additionalLines: [],
      projectTitle: "Website",
    });

    await expect(quotesRepo.setQuoteStatus(quote.id, "accepted")).rejects.toMatchObject({
      code: "invalid_status",
    });
  });

  it("records sent then accepted, and locks the record", async () => {
    const lead = await makeLead("USA", "Accepted Co.");
    const starter = await packageFor("USA", "Starter");
    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: starter.id,
      additionalLines: [],
      projectTitle: "Website",
    });

    const sent = await quotesRepo.setQuoteStatus(quote.id, "sent");
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).not.toBeNull();

    const accepted = await quotesRepo.setQuoteStatus(quote.id, "accepted");
    expect(accepted.status).toBe("accepted");
    expect(accepted.acceptedAt).not.toBeNull();

    await expect(
      quotesRepo.updateQuote(quote.id, {
        leadId: lead.id,
        primaryPackageId: starter.id,
        additionalLines: [],
        projectTitle: "Changed",
      }),
    ).rejects.toMatchObject({ code: "quote_locked" });

    await expect(quotesRepo.refreshQuotePrices(quote.id)).rejects.toMatchObject({
      code: "quote_locked",
    });

    await expect(quotesRepo.deleteQuote(quote.id)).rejects.toMatchObject({ code: "quote_locked" });
  });

  it("derives expiry without rewriting the stored status", async () => {
    const lead = await makeLead("AU", "Expiry Co.");
    const essential = await packageFor("AU", "Essential");
    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: essential.id,
      additionalLines: [],
      projectTitle: "Website",
      validUntil: "2020-01-31",
    });
    await quotesRepo.setQuoteStatus(quote.id, "sent");

    const reloaded = await quotesRepo.getQuote(quote.id);
    expect(reloaded?.status).toBe("sent");
    expect(reloaded?.displayStatus).toBe("expired");

    const accepted = await quotesRepo.setQuoteStatus(quote.id, "accepted");
    expect(accepted.displayStatus).toBe("accepted");
  });

  it("duplicates into an independent draft", async () => {
    const lead = await makeLead("ID", "Duplicate Co.");
    const premium = await packageFor("ID", "Premium");
    const source = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: premium.id,
      additionalLines: [],
      projectTitle: "Website",
    });
    await quotesRepo.setQuoteStatus(source.id, "sent");

    const copy = await quotesRepo.duplicateQuote(source.id);
    expect(copy.id).not.toBe(source.id);
    expect(copy.quoteNumber).not.toBe(source.quoteNumber);
    expect(copy.status).toBe("draft");
    expect(copy.totalMinor).toBe(source.totalMinor);
    expect(copy.sentAt).toBeNull();

    await quotesRepo.updateQuote(copy.id, {
      leadId: lead.id,
      primaryPackageId: premium.id,
      additionalLines: [],
      projectTitle: "Website copy",
    });

    const original = await quotesRepo.getQuote(source.id);
    expect(original?.projectTitle).toBe("Website");
    expect(original?.status).toBe("sent");
  });

  it("deletes a draft", async () => {
    const lead = await makeLead("USA", "Delete Co.");
    const starter = await packageFor("USA", "Starter");
    const quote = await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: starter.id,
      additionalLines: [],
      projectTitle: "Website",
    });

    await quotesRepo.deleteQuote(quote.id);
    expect(await quotesRepo.getQuote(quote.id)).toBeNull();
  });
});

describe("reporting", () => {
  it("never adds different currencies together", async () => {
    const stats = await quotesRepo.getQuoteStats();
    const codes = stats.quotedByCurrency.map((entry) => entry.currencyCode);
    expect(new Set(codes).size).toBe(codes.length);
    expect(stats.total).toBeGreaterThan(0);
  });

  it("lists quotes for a lead and by market", async () => {
    const lead = await makeLead("USA", "Listing Co.");
    const starter = await packageFor("USA", "Starter");
    await quotesRepo.createQuote({
      leadId: lead.id,
      primaryPackageId: starter.id,
      additionalLines: [],
      projectTitle: "Website",
    });

    const forLead = await quotesRepo.listQuotesForLead(lead.id);
    expect(forLead).toHaveLength(1);
    expect(forLead[0]?.leadBusinessName).toBe("Listing Co.");

    const usa = await quotesRepo.listQuotes({ marketCode: "USA", pageSize: 100 });
    expect(usa.quotes.every((quote) => quote.marketCode === "USA")).toBe(true);
  });
});

describe("validation", () => {
  it("rejects a quote without a project title", async () => {
    const lead = await makeLead("USA", "Validation Co.");
    const starter = await packageFor("USA", "Starter");

    await expect(
      quotesRepo.createQuote({
        leadId: lead.id,
        primaryPackageId: starter.id,
        additionalLines: [],
        projectTitle: "   ",
      }),
    ).rejects.toBeInstanceOf(RepositoryError);
  });

  it("rejects an unknown lead", async () => {
    const starter = await packageFor("USA", "Starter");
    await expect(
      quotesRepo.createQuote({
        leadId: "lead_missing",
        primaryPackageId: starter.id,
        additionalLines: [],
        projectTitle: "Website",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});