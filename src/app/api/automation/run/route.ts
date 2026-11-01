import { evaluateAutomation } from "@/lib/automation/repository";
import { handleRouteError, jsonOk } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/**
 * Runs one automation evaluation.
 *
 * On demand by design: this deployment has no cron trigger, so a scheduled claim
 * would be untrue. Everything is idempotent, so calling it repeatedly is safe —
 * the second run opens nothing new.
 */
export async function POST() {
  try {
    const summary = await evaluateAutomation();
    return jsonOk(summary);
  } catch (error) {
    return handleRouteError(error, "POST /api/automation/run");
  }
}