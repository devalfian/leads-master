import { saveCallbookGraph } from "@/lib/callbooks/repository";
import type { CallbookGraph } from "@/lib/callbooks/types";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { saveGraphSchema } from "@/lib/api/schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Saves the whole draft graph atomically. Validation issues are returned but do
 * not block saving a draft — publishing is what requires a valid graph.
 *
 * Phase 2 step context is optional in the payload, so an older client (or a saved
 * draft that predates the fields) still saves; it is normalised here rather than
 * being guessed in the repository.
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { graph } = await readJson(request, saveGraphSchema);
    const normalised: CallbookGraph = {
      startNodeId: graph.startNodeId,
      nodes: graph.nodes.map((node) => ({
        ...node,
        stepType: node.stepType ?? null,
        purpose: node.purpose ?? null,
        talkingPoints: node.talkingPoints ?? [],
      })),
    };

    const result = await saveCallbookGraph(id, normalised);
    return jsonOk({
      callbook: result.callbook,
      validation: result.validation,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleRouteError(error, "PUT /api/callbooks/[id]/graph");
  }
}