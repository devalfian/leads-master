import { updateMarket } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { marketUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, marketUpdateSchema);
    const market = await updateMarket(id, input);
    return jsonOk({ market });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/markets/[id]");
  }
}