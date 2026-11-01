import { updateNichePriceRow } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { nichePriceUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Updates one niche-specific price cell. This is deliberately separate from the
 * package base price so the two can never overwrite each other by accident.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, nichePriceUpdateSchema);
    const row = await updateNichePriceRow(id, input.priceAmount);
    return jsonOk({ nichePriceRow: row });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/pricing/niche-rows/[id]");
  }
}