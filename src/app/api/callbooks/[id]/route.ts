import { getCallbook, updateCallbookMeta } from "@/lib/callbooks/repository";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { callbookMetaSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const callbook = await getCallbook(id);
    if (!callbook) return jsonError("That Callbook no longer exists.", 404, "not_found");
    return jsonOk({ callbook });
  } catch (error) {
    return handleRouteError(error, "GET /api/callbooks/[id]");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const patch = await readJson(request, callbookMetaSchema);
    const callbook = await updateCallbookMeta(id, patch);
    return jsonOk({ callbook });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/callbooks/[id]");
  }
}