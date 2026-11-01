import { deleteSession, updateSession } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { sessionInputSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, sessionInputSchema);
    const session = await updateSession(id, { ...input, customNotes: input.customNotes ?? "" });
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/sessions/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteSession(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/sessions/[id]");
  }
}