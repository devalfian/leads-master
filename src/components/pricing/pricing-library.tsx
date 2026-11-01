"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketTabs } from "@/components/shared/market-tabs";
import { ScheduleBlockCard } from "@/components/shared/schedule-block-card";
import { GuideReferencePanel } from "@/components/session-planner/guide-reference-panel";
import { PackageCard } from "@/components/pricing/package-card";
import { PackageComparisonTable } from "@/components/pricing/package-comparison";
import { NichePriceTable } from "@/components/pricing/niche-price-table";
import { NicheCatalog } from "@/components/pricing/niche-catalog";
import { PackageEditDialog } from "@/components/guide-data/package-edit-dialog";
import { formatMoney } from "@/lib/guides/currency";
import { getRecommendedPackage } from "@/lib/guides/pricing";
import type { MarketGuide } from "@/lib/guides/types";

/**
 * The pricing library. Everything rendered here comes from the database; the
 * edit dialogs write straight back through the API and refresh server data.
 */
export function PricingLibrary({
  guides,
  activeCode,
}: {
  guides: MarketGuide[];
  activeCode: string;
}) {
  const guide = guides.find((entry) => entry.market.code === activeCode) ?? guides[0];
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const recommended = getRecommendedPackage(guide);
  const nicheRowCount = new Set(guide.nichePriceRows.map((row) => row.nicheLabel)).size;
  const editingPackage = guide.packages.find((product) => product.id === editingPackageId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MarketTabs
          markets={guides.map((entry) => entry.market)}
          activeCode={guide.market.code}
          hrefFor={(code) => `/dashboard/pricing/${code}`}
        />
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/sessions/new?market=${guide.market.code}`}>
            Create session for this market
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Market"
          value={guide.market.name}
          detail={`Prices in ${guide.market.currencyCode} (${guide.market.currencyLabel})`}
        />
        <SummaryTile
          label="Target starting price"
          value={formatMoney(
            guide.market.targetPriceAmount,
            {
              currencyCode: guide.market.currencyCode,
              currencyLabel: guide.market.currencyLabel,
            },
            { isStartingPrice: guide.market.targetPriceIsMinimum },
          )}
          detail="Source guide reference target"
        />
        <SummaryTile
          label="Recommended package"
          value={recommended?.name ?? "Not configured"}
          detail={
            recommended
              ? formatMoney(recommended.priceAmount, {
                  currencyCode: guide.market.currencyCode,
                  currencyLabel: guide.market.currencyLabel,
                })
              : "Set a recommended package in the guide data"
          }
          tone="accent"
        />
        <SummaryTile
          label="Guide coverage"
          value={`${guide.nicheCategories.length} niches`}
          detail={`${nicheRowCount} niche price rows · ${guide.schedules.length} schedule blocks`}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Packages</h2>
          <p className="text-[12px] text-muted">
            Source-guide prices · no currency conversion · “+” marks a starting price
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {guide.packages.map((product) => (
            <PackageCard
              key={product.id}
              product={product}
              currencyCode={guide.market.currencyCode}
              currencyLabel={guide.market.currencyLabel}
              isRecommended={product.id === recommended?.id}
              onEdit={() => setEditingPackageId(product.id)}
            />
          ))}
        </div>
      </section>

      <PackageComparisonTable
        packages={guide.packages}
        currencyCode={guide.market.currencyCode}
        currencyLabel={guide.market.currencyLabel}
        recommendedPackageId={recommended?.id ?? null}
      />

      <NichePriceTable guide={guide} />

      <NicheCatalog categories={guide.nicheCategories} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Layers className="size-4 text-accent-soft" aria-hidden="true" />
            Calling schedule
          </h2>
          <Link
            href={`/dashboard/settings/guide-data?market=${guide.market.code}`}
            className="text-[12px] text-accent-soft underline-offset-4 hover:underline"
          >
            Edit schedule in guide data
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {guide.schedules.map((schedule) => (
            <ScheduleBlockCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
        {guide.market.timezoneNote ? (
          <p className="rounded-[10px] border border-border-subtle bg-surface px-3 py-2 text-[12px] leading-relaxed text-secondary">
            <span className="font-medium text-foreground">Source schedule note: </span>
            {guide.market.timezoneNote}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Star className="size-4 text-accent-soft" aria-hidden="true" />
            Call preparation reference
          </h2>
          {guide.market.scheduleNoteReviewRequired ? (
            <Badge tone="warning">Schedule note requires verification</Badge>
          ) : null}
        </div>
        <GuideReferencePanel
          callObjectives={guide.callObjectives.map((goal) => goal.goalText)}
          sessionGoals={guide.sessionGoals.map((goal) => goal.goalText)}
          checklist={guide.checklist.map((item) => item.itemText)}
          objections={guide.objections.map((objection) => ({
            objectionText: objection.objectionText,
            suggestedResponse: objection.suggestedResponse,
          }))}
          tools={guide.tools.map((tool) => ({
            toolName: tool.toolName,
            toolDescription: tool.toolDescription,
          }))}
        />
      </section>

      {editingPackage ? (
        <PackageEditDialog
          product={editingPackage}
          currencyLabel={guide.market.currencyLabel}
          open
          onOpenChange={(open) => {
            if (!open) setEditingPackageId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p
        className={
          tone === "accent"
            ? "mt-1 text-[18px] font-semibold text-accent-soft"
            : "mt-1 text-[18px] font-semibold text-foreground"
        }
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-secondary">{detail}</p>
    </div>
  );
}