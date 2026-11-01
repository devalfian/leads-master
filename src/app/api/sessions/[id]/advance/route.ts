import { advanceCallSession } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { advanceSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Queueable offline. Call Mode replays the steps a user took without a
 * connection in the order they were taken; the idempotency key stops a retried
 * step from being recorded twice and moving the call two steps forward.
 */
export async function POST(request: Request, { params }: Params) {
  return withIdempotency(request, "POST /api/sessions/[id]/advance", () =>
    handlePost(request, { params }),
  );
}

async function handlePost(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, advanceSchema);
    const session = await advanceCallSession(id, {
      branchId: input.branchId,
      responseText: input.responseText ?? null,
    });
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions/[id]/advance");
  }
}