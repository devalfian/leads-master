import { setQuoteStatus } from "@/lib/quotes/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { quoteStatusSchema } from "@/lib/api/quote-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Records a status change the user explicitly chose. Transitions are validated
 * against the lifecycle map, so a quote can never jump straight to accepted.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, quoteStatusSchema);
    const quote = await setQuoteStatus(id, input.status, input.note ?? null);
    return jsonOk({ quote });
  } catch (error) {
    return handleRouteError(error, "POST /api/quotes/[id]/status");
  }
}