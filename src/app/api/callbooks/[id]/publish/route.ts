import { publishCallbook } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await publishCallbook(id);
    return jsonOk({
      callbook: result.callbook,
      version: result.version,
      publishedAt: result.publishedAt,
      warnings: result.warnings,
    });
  } catch (error) {
    return handleRouteError(error, "POST /api/callbooks/[id]/publish");
  }
}