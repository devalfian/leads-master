import { updateSchedule } from "@/lib/guides/repository";
import { handleRouteError, jsonOk, readJson } from "@/lib/api/http";
import { scheduleUpdateSchema } from "@/lib/api/guide-schemas";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const input = await readJson(request, scheduleUpdateSchema);
    const schedule = await updateSchedule(id, input);
    return jsonOk({ schedule });
  } catch (error) {
    return handleRouteError(error, "PATCH /api/schedules/[id]");
  }
}