import { startCallSession } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { startSessionSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Starts a real call session from the currently published snapshot.
 * Draft edits are never used here.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, startSessionSchema);
    const session = await startCallSession(id, {
      prospectName: input.prospectName ?? null,
      leadId: input.leadId ?? null,
    });
    return jsonOk({ session }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/callbooks/[id]/sessions");
  }
}