import { createPackageFeature } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { packageFeatureCreateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, packageFeatureCreateSchema);
    const feature = await createPackageFeature(id, input.featureText);
    return jsonOk({ feature }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/pricing/packages/[id]/features");
  }
}