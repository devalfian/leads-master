import { deleteGuideItem, isGuideResource, updateGuideItem } from "@/lib/guides/repository";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { guideItemUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    if (!isGuideResource(resource)) {
      return jsonError("Unknown guide-data section.", 404, "not_found");
    }
    const input = await readJson(request, guideItemUpdateSchema);
    await updateGuideItem(resource, id, {
      text: input.text,
      secondaryText: input.secondaryText,
    });
    return jsonOk({ updated: true });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/guide-data/[resource]/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    if (!isGuideResource(resource)) {
      return jsonError("Unknown guide-data section.", 404, "not_found");
    }
    await deleteGuideItem(resource, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/guide-data/[resource]/[id]");
  }
}