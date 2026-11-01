import { updatePackage } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { packageUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, packageUpdateSchema);
    const product = await updatePackage(id, input);
    return jsonOk({ package: product });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/pricing/packages/[id]");
  }
}