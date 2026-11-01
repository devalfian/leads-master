import { goBackInCallSession } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

import { withIdempotency } from "@/lib/api/idempotency";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Queueable offline: stepping back must not be applied twice by a replay. */
export async function POST(request: Request, { params }: Params) {
  return withIdempotency(request, "POST /api/sessions/[id]/back", () =>
    handlePost(request, { params }),
  );
}

async function handlePost(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const session = await goBackInCallSession(id);
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions/[id]/back");
  }
}