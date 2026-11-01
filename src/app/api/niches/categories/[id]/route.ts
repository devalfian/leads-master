import { updateNicheCategory } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { nicheCategoryUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, nicheCategoryUpdateSchema);
    const category = await updateNicheCategory(id, input.name);
    return jsonOk({ category });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/niches/categories/[id]");
  }
}