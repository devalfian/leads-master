import { duplicateSession } from "@/lib/guides/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await duplicateSession(id);
    return jsonOk({ session }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions/[id]/duplicate");
  }
}