import { deleteFollowUp, setFollowUpStatus } from "@/lib/leads/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { followUpUpdateSchema } from "@/lib/api/lead-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Queueable offline: completing a follow-up after a call is replayed exactly once. */
export async function PATCH(request: Request, { params }: Params) {
  return withIdempotency(request, "PATCH /api/follow-ups/[id]", () =>
    handlePatch(request, { params }),
  );
}

async function handlePatch(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, followUpUpdateSchema);
    const followUp = await setFollowUpStatus(id, input.status);
    return jsonOk({ followUp });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/follow-ups/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteFollowUp(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/follow-ups/[id]");
  }
}