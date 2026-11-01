import { logLeadCall } from "@/lib/leads/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { logCallSchema } from "@/lib/api/lead-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Logs a call that was made without a Callbook. Callbook runs are recorded by
 * their own session flow and both appear in the same Call History.
 */
export async function POST(request: Request, { params }: Params) {
  // Queueable offline: a call logged without a connection must be recorded once.
  return withIdempotency(request, "POST /api/leads/[id]/calls", () =>
    handlePost(request, { params }),
  );
}

async function handlePost(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, logCallSchema);
    const result = await logLeadCall(id, input);
    return jsonOk(result, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/leads/[id]/calls");
  }
}