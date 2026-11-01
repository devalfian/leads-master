import { createQuote, listQuotes } from "@/lib/quotes/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { quoteWriteSchema } from "@/lib/api/quote-schemas";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await listQuotes({
      query: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status"),
      marketCode: url.searchParams.get("market"),
      page: Number(url.searchParams.get("page")) || 1,
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error, "GET /api/quotes");
  }
}

/**
 * Creates a quotation. The submitted totals are ignored: the server reads the
 * package prices from the pricing database and recalculates everything.
 */
export async function POST(request: Request) {
  try {
    const input = await readJson(request, quoteWriteSchema);
    const quote = await createQuote({
      ...input,
      additionalLines: input.additionalLines ?? [],
    });
    return jsonOk({ quote }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/quotes");
  }
}