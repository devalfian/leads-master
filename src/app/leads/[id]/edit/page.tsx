import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { LeadForm } from "@/components/leads/lead-form";
import { getLead } from "@/lib/leads/repository";
import { loadCallbookMarketOptions } from "@/lib/callbooks/guide-options";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let lead: Awaited<ReturnType<typeof getLead>> = null;
  let markets = await loadCallbookMarketOptions().catch(() => []);
  let error: string | null = null;

  try {
    lead = await getLead(id);
  } catch (loadError) {
    error = describeDataError(loadError, "This lead could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="This lead could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (!lead) notFound();
  markets = markets.length > 0 ? markets : [];

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Leads", href: "/leads" },
          { label: lead.businessName, href: `/leads/${lead.id}` },
          { label: "Edit" },
        ]}
        title="Edit lead"
        description="Editing never rewrites call history — earlier calls keep the notes and outcome they were logged with."
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8">
        <LeadForm markets={markets} mode="edit" initial={lead} />
      </div>
    </div>
  );
}