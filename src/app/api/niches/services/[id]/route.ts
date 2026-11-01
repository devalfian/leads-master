import { deleteNicheService, updateNicheService } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { nicheServiceUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, nicheServiceUpdateSchema);
    const service = await updateNicheService(id, input.name);
    return jsonOk({ service });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/niches/services/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteNicheService(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/niches/services/[id]");
  }
}