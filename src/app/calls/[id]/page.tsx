import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CallSessionView } from "@/components/calls/call-session-view";
import { CallSessionDetailView } from "@/components/calls/call-session-detail";
import { OutcomeBadge } from "@/components/callbooks/status-badges";
import { getCallSession, getCallbook } from "@/lib/callbooks/repository";
import { loadCallbookPricingContext } from "@/lib/callbooks/context";
import type { CallbookPricingContext } from "@/lib/callbooks/pricing-context-types";
import { describeDataError } from "@/lib/data-error";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CallSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ context?: string }>;
}) {
  const { id } = await params;
  const { context } = await searchParams;

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

  if (session.status === "in_progress") {
    // Pricing context is a convenience panel: if the guide data cannot be read the
    // call itself must still work, so a failure here only hides the panel.
    let pricingContext: CallbookPricingContext | null = null;
    try {
      const callbook = await getCallbook(session.callbookId);
      if (callbook) {
        pricingContext = await loadCallbookPricingContext(callbook, context?.trim() || null);
      }
    } catch (contextError) {
      console.error("[calls] pricing context unavailable", contextError);
      pricingContext = null;
    }

    return <CallSessionView initialSession={session} pricingContext={pricingContext} />;
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace" },
          { label: "Call History", href: "/calls" },
          { label: session.prospectName ?? session.callbookTitle },
        ]}
        title={session.prospectName ?? "Call session"}
        description={`${session.callbookTitle} · published v${session.publishedVersion} · ${formatDateTime(session.startedAt)}`}
        meta={<OutcomeBadge outcomeKey={session.outcomeKey} />}
        actions={
          <>
            {session.leadId ? (
              <Button asChild variant="secondary">
                <Link href={`/leads/${session.leadId}`}>
                  <UserRound aria-hidden="true" />
                  View lead
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary">
              <Link href="/calls">
                <ArrowLeft aria-hidden="true" />
                Back to Call History
              </Link>
            </Button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-4xl px-5 py-6 md:px-8">
        <CallSessionDetailView session={session} />
      </div>
    </div>
  );
}