import { deletePackageFeature, updatePackageFeature } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { packageFeatureUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, packageFeatureUpdateSchema);
    const feature = await updatePackageFeature(id, input.featureText);
    return jsonOk({ feature });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/pricing/features/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deletePackageFeature(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/pricing/features/[id]");
  }
}