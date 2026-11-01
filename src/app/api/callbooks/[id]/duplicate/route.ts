import { duplicateCallbook } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const callbook = await duplicateCallbook(id);
    return jsonOk({ callbook }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/callbooks/[id]/duplicate");
  }
}