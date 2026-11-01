import { deleteLead, setLeadArchived, updateLead } from "@/lib/leads/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { withIdempotency } from "@/lib/api/idempotency";
import { leadUpdateSchema } from "@/lib/api/lead-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Queueable offline: an edit replayed after a dropped connection must apply once. */
export async function PATCH(request: Request, { params }: Params) {
  return withIdempotency(request, "PATCH /api/leads/[id]", () => handlePatch(request, { params }));
}

async function handlePatch(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { archived, ...patch } = await readJson(request, leadUpdateSchema);

    if (archived !== undefined) {
      // Archive is a lead-level action, so it is applied even when nothing else changed.
      const lead = await setLeadArchived(id, archived);
      const hasFieldPatch = Object.keys(patch).length > 0;
      if (!hasFieldPatch) return jsonOk({ lead });
      const updated = await updateLead(id, patch);
      return jsonOk({ lead: updated });
    }

    const lead = await updateLead(id, patch);
    return jsonOk({ lead });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/leads/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteLead(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/leads/[id]");
  }
}