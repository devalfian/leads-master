import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { SessionForm } from "@/components/session-planner/session-form";
import { getSession, listMarketGuides } from "@/lib/guides/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let session: Awaited<ReturnType<typeof getSession>> = null;
  let guides: Awaited<ReturnType<typeof listMarketGuides>> = [];
  let error: string | null = null;

  try {
    [session, guides] = await Promise.all([getSession(id), listMarketGuides()]);
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

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Session Planner", href: "/dashboard/sessions" },
          { label: session.title, href: `/dashboard/sessions/${session.id}` },
          { label: "Edit" },
        ]}
        title="Edit session"
        description="Saving refreshes this session's snapshot from the current guide data, so the plan and the stored prices always agree."
      />

      <div className="px-5 py-6 md:px-8">
        <SessionForm
          guides={guides}
          mode="edit"
          initial={{
            id: session.id,
            marketCode: session.marketCode,
            scheduleId: session.scheduleId ?? undefined,
            nicheSlug: session.snapshot.niche.slug,
            sessionDate: session.sessionDate,
            title: session.title,
            objective: session.objective,
            customNotes: session.customNotes,
          }}
        />
      </div>
    </div>
  );
}