import { createFollowUp } from "@/lib/leads/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { followUpCreateSchema } from "@/lib/api/lead-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, followUpCreateSchema);
    const followUp = await createFollowUp(id, input);
    return jsonOk({ followUp }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/leads/[id]/follow-ups");
  }
}