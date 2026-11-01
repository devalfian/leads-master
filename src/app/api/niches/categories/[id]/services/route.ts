import { createNicheService } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { nicheServiceCreateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, nicheServiceCreateSchema);
    const service = await createNicheService(id, input.name);
    return jsonOk({ service }, 201);
  } catch (error) {
    return handleRouteError(error, "POST /api/niches/categories/[id]/services");
  }
}