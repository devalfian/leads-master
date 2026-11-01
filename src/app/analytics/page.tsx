import Link from "next/link";
import { ArrowRight, CalendarClock, Info, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { KpiCard } from "@/components/analytics/kpi-card";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { OutcomeChart } from "@/components/analytics/outcome-chart";
import {
  MarketBreakdownTable,
  NicheBreakdownTable,
  StageDistribution,
} from "@/components/analytics/breakdown-tables";
import { NextActions } from "@/components/analytics/next-actions";
import { loadAnalyticsPageData } from "@/lib/analytics/service";
import { REPORTING_TIMEZONE } from "@/lib/analytics/period";
import { loadCallbookMarketOptions } from "@/lib/callbooks/guide-options";
import type { CallbookMarketOption } from "@/lib/callbooks/types";
import { formatMinorUnits } from "@/lib/quotes/money";
import { describeDataError } from "@/lib/data-error";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sales analytics" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function moneyList(
  rows: Array<{ currencyCode: string; currencyLabel: string; amountMinor: number; count: number }>,
): string {
  if (rows.length === 0) return "—";
  return rows
    .map((row) =>
      formatMinorUnits(row.amountMinor, {
        currencyCode: row.currencyCode,
        currencyLabel: row.currencyLabel,
      }),
    )
    .join(" · ");
}

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const values = {
    preset: single(params.preset) || "30d",
    from: single(params.from),
    to: single(params.to),
    market: single(params.market),
    niche: single(params.niche),
  };

  let data: Awaited<ReturnType<typeof loadAnalyticsPageData>> | null = null;
  let markets: CallbookMarketOption[] = [];
  let error: string | null = null;

  try {
    [data, markets] = await Promise.all([
      loadAnalyticsPageData({
        preset: values.preset,
        from: values.from || null,
        to: values.to || null,
        marketCode: values.market || null,
        nicheCategoryId: values.niche || null,
      }),
      loadCallbookMarketOptions(),
    ]);
  } catch (loadError) {
    error = describeDataError(loadError, "Analytics could not be loaded. Try again.");
  }

  if (error || !data) {
    return (
      <div className="pb-16">
        <PageHeader
          breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Analytics" }]}
          title="Sales analytics"
          description="Understand your outreach performance, monitor your pipeline, and prioritize the next sales action."
        />
        <div className="px-5 py-6 md:px-8">
          <Alert tone="danger" title="Analytics could not be loaded">
            {error ?? "The dashboard could not be prepared."}
          </Alert>
        </div>
      </div>
    );
  }

  const { dashboard } = data;
  const niches = markets.flatMap((market) =>
    market.niches.map((niche) => ({ id: niche.id, name: niche.name, marketCode: market.code })),
  );
  const marketOptions = markets.map((market) => ({ code: market.code, name: market.name }));

  const acceptanceLabel =
    dashboard.quotes.acceptance.value === null
      ? "N/A"
      : `${dashboard.quotes.acceptance.value.toFixed(0)}%`;

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace", href: "/dashboard" }, { label: "Analytics" }]}
        title="Sales analytics"
        description="Understand your outreach performance, monitor your pipeline, and prioritize the next sales action. Every figure is counted from stored records for the period below."
        meta={
          <>
            <Badge tone="accent">{dashboard.period.label}</Badge>
            <Badge tone="neutral">
              Reporting timezone: {REPORTING_TIMEZONE.label} ({REPORTING_TIMEZONE.id})
            </Badge>
          </>
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/automation">
              <CalendarClock aria-hidden="true" />
              Automation
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        <AnalyticsFilters values={values} markets={marketOptions} niches={niches} />

        <p className="text-[11.5px] text-muted">
          Calculated {formatDateTime(new Date().toISOString())} from live records — the page is not
          cached.
        </p>

        {/* KPI cards ------------------------------------------------------- */}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Calls made"
            value={String(dashboard.activity.callsMade)}
            definition="Logged calls plus completed Callbook runs whose call time falls inside the period."
            comparison={{
              current: dashboard.activity.callsMade,
              previous: dashboard.activity.previous.callsMade,
            }}
          />
          <KpiCard
            label="Leads contacted"
            value={String(dashboard.activity.uniqueLeadsContacted)}
            definition="Distinct leads with at least one call in the period. A lead called five times counts once."
            comparison={{
              current: dashboard.activity.uniqueLeadsContacted,
              previous: dashboard.activity.previous.uniqueLeadsContacted,
            }}
          />
          <KpiCard
            label="Conversations"
            value={String(dashboard.activity.conversations)}
            definition="Calls whose recorded outcome required someone to speak. No answer and wrong number are attempts, not conversations."
            comparison={{
              current: dashboard.activity.conversations,
              previous: dashboard.activity.previous.conversations,
            }}
          />
          <KpiCard
            label="Interested prospects"
            value={String(dashboard.activity.interestedLeads)}
            definition="Distinct leads with an explicit interest outcome (meeting booked, or interested without a meeting)."
            comparison={{
              current: dashboard.activity.interestedLeads,
              previous: dashboard.activity.previous.interestedLeads,
            }}
          />
          <KpiCard
            label="Follow-ups due"
            value={String(dashboard.activity.followUpsDue)}
            definition="Scheduled follow-ups whose due day falls inside the reporting period (WIB)."
            unavailableReason="Scheduled work in this window — not compared with the previous period."
          />
          <KpiCard
            label="Follow-ups overdue"
            value={String(dashboard.activity.followUpsOverdue)}
            definition="Scheduled follow-ups whose due day has passed (today's follow-ups are not overdue). Completed and cancelled tasks are excluded."
            tone={dashboard.activity.followUpsOverdue > 0 ? "warning" : "default"}
            unavailableReason="Current state as of right now, not period-scoped."
          />
          <KpiCard
            label="Quotes sent"
            value={String(dashboard.quotes.sent)}
            definition="Quotations marked as sent during the period, using the recorded sent timestamp."
            unavailableReason={`${dashboard.quotes.created} created in this period.`}
          />
          <KpiCard
            label="Quote acceptance"
            value={acceptanceLabel}
            definition="Accepted ÷ (accepted + rejected) for outcomes recorded in this period. Drafts, undecided and cancelled quotes are excluded."
            unavailableReason={
              dashboard.quotes.acceptance.denominator === 0
                ? "No quotation has a recorded final outcome in this period."
                : `${dashboard.quotes.acceptance.numerator} of ${dashboard.quotes.acceptance.denominator} decided quotations.`
            }
          />
        </section>

        {/* Funnel and trend ------------------------------------------------ */}

        <section className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-card border border-border-subtle bg-surface p-4 xl:col-span-1">
            <h2 className="text-[15px] font-semibold text-foreground">Sales funnel</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Cohort of leads created in this period. Counts, not a historical conversion log — this
              application does not store stage transitions.
            </p>
            <div className="mt-3">
              <FunnelChart stages={dashboard.funnel} cohortSize={dashboard.funnelCohortSize} />
            </div>
          </div>

          <div className="rounded-card border border-border-subtle bg-surface p-4 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground">Outreach activity</h2>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  Calls and conversations per {REPORTING_TIMEZONE.label} calendar day.
                </p>
              </div>
              <Badge tone="neutral">
                {dashboard.period.fromDate} → {dashboard.period.toDate}
              </Badge>
            </div>
            <div className="mt-3">
              <TrendChart points={dashboard.trend} />
            </div>
          </div>
        </section>

        {/* Outcomes, pipeline and quotations ------------------------------ */}

        <section className="grid gap-3 xl:grid-cols-3">
          <div className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Call outcomes</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Structured outcomes for the {dashboard.activity.callsMade} call
              {dashboard.activity.callsMade === 1 ? "" : "s"} in this period.
            </p>
            <div className="mt-3">
              <OutcomeChart
                slices={dashboard.outcomes}
                total={dashboard.activity.callsMade}
              />
            </div>
          </div>

          <div className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Pipeline</h2>
            <dl className="mt-2 space-y-1.5 text-[12.5px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Quotes awaiting a decision</dt>
                <dd className="text-foreground">{dashboard.pipeline.quotesAwaitingDecision}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Expiring within the reminder window</dt>
                <dd className="text-foreground">{dashboard.pipeline.expiringQuotes}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Leads needing attention</dt>
                <dd className="text-foreground">{dashboard.pipeline.leadsRequiringAttention}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Outstanding quoted value</dt>
                <dd className="text-right text-foreground">
                  {moneyList(dashboard.quotes.outstanding)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Accepted quoted value (period)</dt>
                <dd className="text-right text-foreground">
                  {moneyList(dashboard.quotes.acceptedValue)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Quoted value, not revenue: this application stores no payment record. Currencies are
              never added together.
            </p>
            <div className="mt-3 border-t border-border-subtle pt-3">
              <StageDistribution
                rows={dashboard.pipeline.byStage}
                activeLeads={dashboard.pipeline.activeLeads}
              />
            </div>
          </div>

          <div className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[15px] font-semibold text-foreground">By niche</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Outreach volume per niche. A high call count is activity, not a quality signal.
            </p>
            <div className="mt-3">
              <NicheBreakdownTable rows={dashboard.byNiche} />
            </div>
          </div>
        </section>

        {/* Market breakdown ----------------------------------------------- */}

        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">By market</h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                Activity and recorded outcomes per market. The decided-quotation count is shown next
                to each acceptance rate so small samples stay visible.
              </p>
            </div>
            <Badge tone="neutral">{dashboard.byMarket.length} markets with activity</Badge>
          </div>
          <div className="mt-3">
            <MarketBreakdownTable rows={dashboard.byMarket} />
          </div>
        </section>

        {/* Next actions --------------------------------------------------- */}

        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">Next actions</h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                Recommended from the rules and the records they matched. Ordered by priority, then by
                due time. One card per lead — related facts are folded in, not repeated.
              </p>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/automation">
                <LayoutDashboard aria-hidden="true" />
                Automation rules
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-3">
            <NextActions actions={dashboard.actions} />
          </div>
        </section>

        {/* Data notes ----------------------------------------------------- */}

        <section className="rounded-card border border-border-subtle bg-surface/60 p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Info className="size-3.5 text-accent-soft" aria-hidden="true" />
            How to read these figures
          </h2>
          <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-muted">
            {dashboard.dataNotes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
            <li>
              • Calls in the previous comparison period: {dashboard.activity.previous.callsMade}.
              Deltas only appear where the previous window has activity to compare with.
            </li>
            <li>
              • Reporting periods are WIB calendar days with an exclusive end, and every timestamp is
              stored in UTC.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}