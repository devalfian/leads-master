import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tags } from "lucide-react";
import { listMarketGuides } from "@/lib/guides/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

/** The library opens on the first configured market; each market has its own URL. */
export default async function PricingIndexPage() {
  let guides: Awaited<ReturnType<typeof listMarketGuides>> = [];
  let error: string | null = null;

  try {
    guides = await listMarketGuides();
  } catch (loadError) {
    error = describeDataError(loadError, "The pricing library could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="The pricing library could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="pb-16">
        <PageHeader
          breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Pricing Library" }]}
          title="Pricing Library"
          description="Prices, packages and niche tables from the three source guides."
        />
        <div className="px-5 py-6 md:px-8">
          <EmptyState
            icon={Tags}
            title="No guide data is available"
            description="Apply the database migrations so the Indonesia, Australia and United States guides are imported."
          />
        </div>
      </div>
    );
  }

  redirect(`/dashboard/pricing/${guides[0].market.code}`);
}