import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateCallbookForm } from "@/components/callbooks/create-callbook-form";
import { CALLBOOK_TEMPLATES, templateSummary } from "@/lib/callbooks/templates";
import { loadCallbookMarketOptions } from "@/lib/callbooks/guide-options";
import type { CallbookMarketOption } from "@/lib/callbooks/types";
import { describeDataError } from "@/lib/data-error";

export const metadata = { title: "Create Callbook" };

export default async function NewCallbookPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const { method } = await searchParams;

  let markets: CallbookMarketOption[] = [];
  let marketError: string | null = null;
  try {
    markets = await loadCallbookMarketOptions();
  } catch (loadError) {
    marketError = describeDataError(
      loadError,
      "The market and niche lists could not be loaded. You can still create a Callbook and set them later.",
    );
  }

  const templates = CALLBOOK_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    targetAudience: template.targetAudience,
    primaryGoal: template.primaryGoal,
    guidance: template.guidance,
    marketCode: template.marketCode ?? null,
    nicheName: template.nicheName ?? null,
    summary: templateSummary(template),
  }));

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace" },
          { label: "Call Playbooks", href: "/callbooks" },
          { label: "New" },
        ]}
        title="Create Callbook"
        description="Name the conversation, choose who it is for, and decide how to start. You can refine everything in the builder."
        actions={
          <Button asChild variant="ghost">
            <Link href="/callbooks">
              <ArrowLeft aria-hidden="true" />
              Back to Call Playbooks
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8">
        {marketError ? (
          <Alert tone="warning" title="Market and niche lists are unavailable">
            {marketError}
          </Alert>
        ) : null}
        <CreateCallbookForm
          templates={templates}
          markets={markets}
          initialMethod={method === "template" ? "template" : "scratch"}
        />
      </div>
    </div>
  );
}