import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PricingLibrary } from "@/components/pricing/pricing-library";
import { listMarketGuides } from "@/lib/guides/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export default async function MarketPricingPage({
  params,
}: {
  params: Promise<{ marketCode: string }>;
}) {
  const { marketCode } = await params;

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

  const guide = guides.find(
    (entry) => entry.market.code.toUpperCase() === marketCode.trim().toUpperCase(),
  );
  if (!guide) notFound();

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Pricing Library" },
          { label: guide.market.name },
        ]}
        title="Pricing Library"
        description={`${guide.market.name} guide data — packages, niche prices and the calling schedule. Every figure below is a source-guide reference, not a quote.`}
        actions={
          <Button asChild>
            <Link href={`/dashboard/sessions/new?market=${guide.market.code}`}>
              <CalendarPlus aria-hidden="true" />
              Create session
            </Link>
          </Button>
        }
      />

      <div className="px-5 py-6 md:px-8">
        <PricingLibrary guides={guides} activeCode={guide.market.code} />
      </div>
    </div>
  );
}