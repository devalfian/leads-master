import { createLead } from "@/lib/leads/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { leadCreateSchema } from "@/lib/api/lead-schemas";

export const dynamic = "force-dynamic";

/**
 * `withIdempotency` wraps this write because it can be queued offline: the
 * browser replays it when the connection returns, and a replay must not create
 * a second lead.
 */
export async function POST(request: Request) {
  return withIdempotency(request, "POST /api/leads", () => handlePost(request));
}

async function handlePost(request: Request) {
  try {
    const input = await readJson(request, leadCreateSchema);
    const lead = await createLead(input);
    return jsonOk({ lead }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/leads");
  }
}