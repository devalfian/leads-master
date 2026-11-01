import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { LeadForm } from "@/components/leads/lead-form";
import { loadCallbookMarketOptions } from "@/lib/callbooks/guide-options";
import type { CallbookMarketOption } from "@/lib/callbooks/types";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Add lead" };

export default async function NewLeadPage() {
  let markets: CallbookMarketOption[] = [];
  let error: string | null = null;

  try {
    markets = await loadCallbookMarketOptions();
  } catch (loadError) {
    error = describeDataError(loadError, "The market list could not be loaded. Try again.");
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Leads", href: "/leads" },
          { label: "Add lead" },
        ]}
        title="Add a lead"
        description="Only the business name and market are required — add what you know and leave the rest for later research."
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="The form could not be prepared">
            {error}
          </Alert>
        ) : (
          <LeadForm markets={markets} mode="create" />
        )}
      </div>
    </div>
  );
}