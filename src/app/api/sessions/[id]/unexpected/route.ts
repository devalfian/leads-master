import { recordUnexpectedResponse } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { unexpectedSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Queueable offline: an unexpected answer recorded offline must reach the log once. */
export async function POST(request: Request, { params }: Params) {
  return withIdempotency(request, "POST /api/sessions/[id]/unexpected", () =>
    handlePost(request, { params }),
  );
}

async function handlePost(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, unexpectedSchema);
    const session = await recordUnexpectedResponse(id, {
      responseText: input.responseText,
      note: input.note ?? null,
      branchId: input.branchId ?? null,
    });
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions/[id]/unexpected");
  }
}