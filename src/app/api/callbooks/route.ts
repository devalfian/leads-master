import { createCallbook, listCallbooks } from "@/lib/callbooks/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { createCallbookSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const callbooks = await listCallbooks();
    return jsonOk({ callbooks });
  } catch (error) {
    return handleRouteError(error, "GET /api/callbooks");
  }
}

export async function POST(request: Request) {
  try {
    const input = await readJson(request, createCallbookSchema);
    const callbook = await createCallbook({
      title: input.title,
      targetAudience: input.targetAudience,
      description: input.description,
      primaryGoal: input.primaryGoal,
      templateId: input.templateId ?? null,
      // Phase 2 context. Forwarded explicitly so the values reach the repository
      // (and are validated there against the guide data).
      marketId: input.marketId ?? null,
      nicheCategoryId: input.nicheCategoryId ?? null,
      language: input.language ?? null,
      internalNotes: input.internalNotes,
    });
    return jsonOk({ callbook }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/callbooks");
  }
}