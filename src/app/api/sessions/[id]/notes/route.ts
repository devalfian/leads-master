import { addSessionNote } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { noteSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Queueable offline: a note written during a call must not be stored twice. */
export async function POST(request: Request, { params }: Params) {
  return withIdempotency(request, "POST /api/sessions/[id]/notes", () =>
    handlePost(request, { params }),
  );
}

async function handlePost(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { body } = await readJson(request, noteSchema);
    const result = await addSessionNote(id, body);
    return jsonOk({ note: result.note, session: result.session }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions/[id]/notes");
  }
}