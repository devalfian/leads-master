import { refreshQuotePrices } from "@/lib/quotes/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Re-prices the package lines of a draft from the current catalog.
 *
 * This is never automatic: the detail page shows the saved and current amounts
 * and calls this route only after the operator confirms. Sent quotations are
 * refused, so a document already given to a client cannot be rewritten.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const quote = await refreshQuotePrices(id);
    return jsonOk({ quote });
  } catch (error) {
    return handleRouteError(error, "POST /api/quotes/[id]/refresh-prices");
  }
}