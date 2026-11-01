import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SessionActions } from "@/components/session-planner/session-actions";
import { SessionDetailSections } from "@/components/session-planner/session-detail";
import { SessionCallbooks } from "@/components/session-planner/session-callbooks";
import { getSession } from "@/lib/guides/repository";
import { listCallbooks } from "@/lib/callbooks/repository";
import type { CallbookSummary } from "@/lib/callbooks/types";
import { describeDataError } from "@/lib/data-error";
import { formatDateOnly, formatWibRange } from "@/lib/guides/format";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let session: Awaited<ReturnType<typeof getSession>> = null;
  let callbooks: CallbookSummary[] = [];
  let error: string | null = null;

  try {
    session = await getSession(id);
  } catch (loadError) {
    error = describeDataError(loadError, "This session could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="This session could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (!session) notFound();

  // Callbook suggestions are an enhancement: a failure here must not hide the plan.
  try {
    callbooks = await listCallbooks();
  } catch (callbookError) {
    console.error("[sessions] callbooks unavailable", callbookError);
    callbooks = [];
  }

  const schedule = session.snapshot.schedule;

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Session Planner", href: "/dashboard/sessions" },
          { label: session.title },
        ]}
        title={session.title}
        description={`${session.marketName} · ${formatDateOnly(session.sessionDate)}${
          schedule ? ` · ${formatWibRange(schedule.startTimeWib, schedule.endTimeWib, schedule.timezoneLabel)}` : ""
        }`}
        meta={
          <>
            <Badge tone="accent">{session.marketCode}</Badge>
            <Badge tone="neutral">{session.selectedNicheLabel ?? "General session"}</Badge>
          </>
        }
        actions={<SessionActions sessionId={session.id} sessionTitle={session.title} />}
      />

      <div className="px-5 py-6 md:px-8 print:px-0 print:py-2">
        <div className="space-y-4 print:hidden">
          <SessionCallbooks session={session} callbooks={callbooks} />
        </div>
        <SessionDetailSections session={session} />
      </div>
    </div>
  );
}