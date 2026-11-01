import { setCallbookArchived } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { archiveSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { archived } = await readJson(request, archiveSchema);
    const callbook = await setCallbookArchived(id, archived);
    return jsonOk({ callbook });
  } catch (error) {
    return handleRouteError(error, "POST /api/callbooks/[id]/archive");
  }
}