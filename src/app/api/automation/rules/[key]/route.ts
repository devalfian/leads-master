import { saveRuleState } from "@/lib/automation/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { rulePatchSchema } from "@/lib/api/automation-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ key: string }> };

/**
 * Updates one rule's enabled flag and/or its numeric window.
 *
 * The response is the stored state, so the UI shows what was actually saved
 * rather than what it hoped was saved.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { key } = await params;
    const patch = await readJson(request, rulePatchSchema);
    const state = await saveRuleState(key, patch);
    return jsonOk({ rule: state });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/automation/rules/[key]");
  }
}