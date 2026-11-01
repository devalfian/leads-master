import Link from "next/link";
import { Database } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketTabs } from "@/components/shared/market-tabs";
import { MarketNoteBar } from "@/components/guide-data/market-note-bar";
import { PackageSettingsList } from "@/components/guide-data/package-settings-list";
import { ScheduleSettingsList } from "@/components/guide-data/schedule-settings-list";
import { ReferenceSettingsList } from "@/components/guide-data/reference-settings-list";
import { SeedValidationPanel } from "@/components/guide-data/seed-report";
import { NichePriceTable } from "@/components/pricing/niche-price-table";
import { NicheCatalog } from "@/components/pricing/niche-catalog";
import { listMarketGuides } from "@/lib/guides/repository";
import { validateGuideSeed } from "@/lib/guides/seed-validation";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Guide data" };

export default async function GuideDataPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;

  let guides: Awaited<ReturnType<typeof listMarketGuides>> = [];
  let report: Awaited<ReturnType<typeof validateGuideSeed>> | null = null;
  let error: string | null = null;

  try {
    guides = await listMarketGuides();
    report = await validateGuideSeed();
  } catch (loadError) {
    error = describeDataError(loadError, "The guide data could not be loaded. Try again.");
  }

  const requested = (market ?? guides[0]?.market.code ?? "").toUpperCase();
  const guide = guides.find((entry) => entry.market.code === requested) ?? guides[0] ?? null;

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Guide data" }]}
        title="Guide data"
        description="The source-guide tables behind the pricing library and session planner. Every change is written to D1 and used by the next session you create."
      />

      <div className="space-y-5 px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="Guide data could not be loaded">
            {error}
          </Alert>
        ) : !guide || !report ? (
          <EmptyState
            icon={Database}
            title="No guide data is available"
            description="Apply the database migrations to import the three source guides."
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <MarketTabs
                markets={guides.map((entry) => entry.market)}
                activeCode={guide.market.code}
                hrefFor={(code) => `/dashboard/settings/guide-data?market=${code}`}
              />
              <Link
                href={`/dashboard/pricing/${guide.market.code}`}
                className="text-[12px] text-accent-soft underline-offset-4 hover:underline"
              >
                View this market in the pricing library
              </Link>
            </div>

            <Alert tone="info" title="Editing scope">
              A package base price, a niche price cell and a single inclusion are three separate
              records. Editing one never rewrites the others, and existing session snapshots are never
              changed by an edit here.
            </Alert>

            <MarketNoteBar market={guide.market} />

            <SeedValidationPanel report={report} />

            <PackageSettingsList guide={guide} />

            <NichePriceTable guide={guide} />

            <NicheCatalog categories={guide.nicheCategories} />

            <ScheduleSettingsList schedules={guide.schedules} />

            <div className="grid gap-4 xl:grid-cols-2">
              <ReferenceSettingsList
                resource="call-objectives"
                title="Call objectives"
                description="Selected as the primary objective when a session is created."
                marketId={guide.market.id}
                marketName={guide.market.name}
                items={guide.callObjectives.map((goal) => ({
                  id: goal.id,
                  text: goal.goalText,
                  secondaryText: "",
                }))}
              />
              <ReferenceSettingsList
                resource="session-goals"
                title="Session goals"
                description={
                  guide.sessionGoals.length === 0
                    ? "This market's guide lists no separate session goals."
                    : "The guide's own session goals, shown for reference."
                }
                marketId={guide.market.id}
                marketName={guide.market.name}
                items={guide.sessionGoals.map((goal) => ({
                  id: goal.id,
                  text: goal.goalText,
                  secondaryText: "",
                }))}
              />
              <ReferenceSettingsList
                resource="checklist"
                title="Information to uncover"
                description="Discovery checklist shown on the saved session page."
                marketId={guide.market.id}
                marketName={guide.market.name}
                items={guide.checklist.map((item) => ({
                  id: item.id,
                  text: item.itemText,
                  secondaryText: "",
                }))}
              />
              <ReferenceSettingsList
                resource="objections"
                title="Common objections"
                description="Objection plus the source guide's suggested response."
                marketId={guide.market.id}
                marketName={guide.market.name}
                items={guide.objections.map((objection) => ({
                  id: objection.id,
                  text: objection.objectionText,
                  secondaryText: objection.suggestedResponse,
                }))}
              />
              <ReferenceSettingsList
                resource="tools"
                title="Recommended tools"
                description="Tools to have ready before dialling."
                marketId={guide.market.id}
                marketName={guide.market.name}
                items={guide.tools.map((tool) => ({
                  id: tool.id,
                  text: tool.toolName,
                  secondaryText: tool.toolDescription,
                }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}