import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionForm } from "@/components/session-planner/session-form";
import { listMarketGuides } from "@/lib/guides/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "New session" };

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;
  let guides: Awaited<ReturnType<typeof listMarketGuides>> = [];
  let error: string | null = null;

  try {
    guides = await listMarketGuides();
  } catch (loadError) {
    error = describeDataError(loadError, "The guide data could not be loaded. Try again.");
  }

  const requested = market?.trim().toUpperCase();

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Session Planner", href: "/dashboard/sessions" },
          { label: "New session" },
        ]}
        title="Create a session"
        description="Choose the market and schedule from the guide data, then review the exact package recommendation before saving."
      />

      <div className="px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="The session planner could not be loaded">
            {error}
          </Alert>
        ) : guides.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No markets are configured"
            description="Guide data is missing. Apply the database migrations so the three market guides are available."
          />
        ) : (
          <SessionForm guides={guides} mode="create" initial={{ marketCode: requested }} />
        )}
      </div>
    </div>
  );
}