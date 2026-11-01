import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CallSummaryForm } from "@/components/calls/call-summary-form";
import { getCallSession } from "@/lib/callbooks/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Save call result" };

export default async function CallSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let session: Awaited<ReturnType<typeof getCallSession>> = null;
  let error: string | null = null;

  try {
    session = await getCallSession(id);
  } catch (loadError) {
    error = describeDataError(loadError, "This call could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="Call could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (!session) notFound();
  if (session.status !== "in_progress") redirect(`/calls/${session.id}`);

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace" },
          { label: "Call History", href: "/calls" },
          { label: session.prospectName ?? session.callbookTitle, href: `/calls/${session.id}` },
          { label: "Save result" },
        ]}
        title="Save the call result"
        description="Turn this conversation into an actionable record. Nothing is saved until you submit the form."
        actions={
          <Button asChild variant="ghost">
            <Link href={`/calls/${session.id}`}>
              <ArrowLeft aria-hidden="true" />
              Back to the call
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8">
        <CallSummaryForm session={session} />
      </div>
    </div>
  );
}