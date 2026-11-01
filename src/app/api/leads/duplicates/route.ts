import { findPossibleDuplicates } from "@/lib/leads/repository";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api/http";
import { leadDuplicateQuerySchema } from "@/lib/api/lead-schemas";

export const dynamic = "force-dynamic";

/**
 * Duplicate **warning** lookup. It never merges or blocks anything: the create form
 * shows the matches and the user decides what to do.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = leadDuplicateQuerySchema.safeParse({
      name: url.searchParams.get("name") ?? undefined,
      city: url.searchParams.get("city") ?? undefined,
      phone: url.searchParams.get("phone") ?? undefined,
      email: url.searchParams.get("email") ?? undefined,
      website: url.searchParams.get("website") ?? undefined,
      marketId: url.searchParams.get("marketId") ?? undefined,
      excludeId: url.searchParams.get("excludeId") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError("Provide a market to check for duplicates.", 422, "validation_failed");
    }

    const leads = await findPossibleDuplicates(
      {
        businessName: parsed.data.name ?? "",
        city: parsed.data.city,
        phone: parsed.data.phone,
        email: parsed.data.email,
        website: parsed.data.website,
      },
      { marketId: parsed.data.marketId, excludeId: parsed.data.excludeId ?? null },
    );

    return jsonOk({ leads });
  } catch (error) {
    return handleRouteError(error, "GET /api/leads/duplicates");
  }
}