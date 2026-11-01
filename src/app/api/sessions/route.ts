import { createSession } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { sessionInputSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const input = await readJson(request, sessionInputSchema);
    const session = await createSession({ ...input, customNotes: input.customNotes ?? "" });
    return jsonOk({ session }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/sessions");
  }
}