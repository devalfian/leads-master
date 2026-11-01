import { deleteQuote, getQuote, updateQuote } from "@/lib/quotes/repository";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api/http";
import { quoteWriteSchema } from "@/lib/api/quote-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    if (!quote) return jsonError("That quotation no longer exists.", 404, "not_found");
    return jsonOk({ quote });
  } catch (error) {
    return handleRouteError(error, "GET /api/quotes/[id]");
  }
}

/** Draft-only edit. A sent or accepted quotation must be duplicated instead. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, quoteWriteSchema);
    const quote = await updateQuote(id, {
      ...input,
      additionalLines: input.additionalLines ?? [],
    });
    return jsonOk({ quote });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/quotes/[id]");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteQuote(id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/quotes/[id]");
  }
}