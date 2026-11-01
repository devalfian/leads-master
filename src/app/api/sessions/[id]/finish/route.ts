import { finishCallSession } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { finishSessionSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Queueable offline: the call result is the most valuable thing recorded during
 * a field call, so it is saved on the device and replayed exactly once.
 */
export async function POST(request: Request, { params }: Params) {
  return withIdempotency(request, "POST /api/sessions/[id]/finish", () =>
    handlePost(request, { params }),
  );
}

async function handlePost(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, finishSessionSchema);
    const session = await finishCallSession(id, {
      outcomeKey: input.outcomeKey,
      notes: input.notes ?? "",
      nextAction: input.nextAction ?? null,
      followUpAt: input.followUpAt ?? null,
    });
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions/[id]/finish");
  }
}