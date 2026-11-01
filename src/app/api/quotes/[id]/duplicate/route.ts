import { duplicateQuote } from "@/lib/quotes/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Copies a quote into a new draft with a fresh number. Status is never copied. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const quote = await duplicateQuote(id);
    return jsonOk({ quote }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/quotes/[id]/duplicate");
  }
}