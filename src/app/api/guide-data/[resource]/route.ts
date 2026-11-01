import { createGuideItem, isGuideResource } from "@/lib/guides/repository";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { guideItemCreateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ resource: string }> };

/** `resource` is one of call-objectives, session-goals, checklist, objections, tools. */
export async function POST(request: Request, { params }: Params) {
  try {
    const { resource } = await params;
    if (!isGuideResource(resource)) {
      return jsonError("Unknown guide-data section.", 404, "not_found");
    }
    const input = await readJson(request, guideItemCreateSchema);
    await createGuideItem(resource, input.marketId, {
      text: input.text,
      secondaryText: input.secondaryText,
    });
    return jsonOk({ created: true }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/guide-data/[resource]");
  }
}