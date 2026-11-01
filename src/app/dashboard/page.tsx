import Link from "next/link";
import { ArrowRight, CalendarPlus, Layers, Sparkles, Tags } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/guides/currency";
import { formatDateOnly } from "@/lib/guides/format";
import { getRecommendedPackage } from "@/lib/guides/pricing";
import { listMarketGuides, listSessions } from "@/lib/guides/repository";
import { getLeadStats, type LeadStats } from "@/lib/leads/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  let guides: Awaited<ReturnType<typeof listMarketGuides>> = [];
  let sessions: Awaited<ReturnType<typeof listSessions>> = [];
  let stats: LeadStats | null = null;
  let error: string | null = null;

  try {
    [guides, sessions] = await Promise.all([listMarketGuides(), listSessions(5)]);
  } catch (loadError) {
    error = describeDataError(loadError, "The workspace could not be loaded. Try again.");
  }

  // Lead figures are an enhancement: a failure only hides the pipeline block.
  try {
    stats = await getLeadStats();
  } catch (statsError) {
    console.error("[dashboard] lead stats unavailable", statsError);
    stats = null;
  }

  const totalNiches = guides.reduce((total, guide) => total + guide.nicheCategories.length, 0);
  const needsReview = guides.filter((guide) => guide.market.scheduleNoteReviewRequired);

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace" }, { label: "Overview" }]}
        title="Sales workspace"
        description="Calling sessions and the pricing guide data behind them, for Indonesia, Australia and the United States."
        actions={
          <Button asChild>
            <Link href="/dashboard/sessions/new">
              <CalendarPlus aria-hidden="true" />
              Create session
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="The workspace could not be loaded">
            {error}
          </Alert>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {guides.map((guide) => {
                const recommended = getRecommendedPackage(guide);
                return (
                  <article
                    key={guide.market.id}
                    className="rounded-card border border-border-subtle bg-surface p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-[15px] font-semibold text-foreground">
                        {guide.market.name}
                      </h2>
                      <Badge tone="neutral">{guide.market.currencyCode}</Badge>
                    </div>

                    <p className="mt-3 text-[11px] uppercase tracking-wider text-muted">
                      Reference target
                    </p>
                    <p className="text-[21px] font-bold text-foreground">
                      {formatMoney(
                        guide.market.targetPriceAmount,
                        {
                          currencyCode: guide.market.currencyCode,
                          currencyLabel: guide.market.currencyLabel,
                        },
                        { isStartingPrice: guide.market.targetPriceIsMinimum },
                      )}
                    </p>
                    <p className="mt-1 text-[12px] text-secondary">
                      Recommended: {recommended?.name ?? "not configured"}
                      {recommended
                        ? ` · ${formatMoney(recommended.priceAmount, {
                            currencyCode: guide.market.currencyCode,
                            currencyLabel: guide.market.currencyLabel,
                          })}`
                        : ""}
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded-[8px] border border-border-subtle bg-surface-elevated px-2 py-1.5">
                        <dt className="text-muted">Niches</dt>
                        <dd className="font-medium text-foreground">
                          {guide.nicheCategories.length}
                        </dd>
                      </div>
                      <div className="rounded-[8px] border border-border-subtle bg-surface-elevated px-2 py-1.5">
                        <dt className="text-muted">Schedule blocks</dt>
                        <dd className="font-medium text-foreground">{guide.schedules.length}</dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex items-center gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/pricing/${guide.market.code}`}>
                          Pricing
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/dashboard/sessions/new?market=${guide.market.code}`}>
                          Plan a session
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </section>

            {needsReview.length > 0 ? (
              <Alert tone="warning" title="Some schedules need timezone verification">
                {needsReview.map((guide) => guide.market.name).join(", ")} — the source guide&apos;s
                schedule note requires manual review. Sessions can still be created; the configured WIB
                times are used as entered.
              </Alert>
            ) : null}

            {stats ? (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">Pipeline</h2>
                <Link
                  href="/leads"
                  className="text-[12px] text-accent-soft underline-offset-4 hover:underline"
                >
                  Open leads
                </Link>
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: "Leads", value: stats.totalLeads },
                  { label: "New", value: stats.newLeads },
                  { label: "Interested", value: stats.interestedLeads },
                  { label: "Qualified", value: stats.qualifiedLeads },
                  { label: "Calls logged", value: stats.totalCalls },
                  { label: "Never contacted", value: stats.neverContacted },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-card border border-border-subtle bg-surface px-3 py-2.5"
                  >
                    <dt className="text-[10.5px] uppercase tracking-wider text-muted">{card.label}</dt>
                    <dd className="text-[18px] font-semibold text-foreground">{card.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[11px] leading-relaxed text-muted">
                &ldquo;Calls logged&rdquo; counts every recorded attempt, including a Callbook run that
                was started but never finished. Analytics counts only finished calls inside the period
                it covers.
              </p>
                <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-card border border-warning/30 bg-warning/10 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-warning">Follow-ups</p>
                  <p className="mt-0.5 text-[12.5px] text-secondary">
                    {stats.overdue} overdue · {stats.dueToday} due today · {stats.openFollowUps} scheduled
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Due/overdue are calendar-day comparisons in WIB — the same rule the lead page,
                    Analytics and Automation use.
                  </p>
                </div>
                <div className="rounded-card border border-border-subtle bg-surface px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted">
                    Estimated pipeline (per currency)
                  </p>
                  {stats.pipelineByMarket.length === 0 ? (
                    <p className="mt-0.5 text-[12.5px] text-secondary">
                      No estimated values recorded yet.
                    </p>
                  ) : (
                    <ul className="mt-1 space-y-0.5">
                      {stats.pipelineByMarket.map((row) => (
                        <li key={row.marketCode} className="flex justify-between gap-2 text-[12.5px]">
                          <span className="text-secondary">{row.marketCode}</span>
                          <span className="text-foreground">
                            {formatMoney(row.amount, {
                              currencyCode: row.currencyCode,
                              currencyLabel: row.currencyLabel,
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-[11px] text-muted">
                    Sum of estimated values on open leads. Currencies are not converted.
                  </p>
                </div>
              </div>
            </section>
            ) : null}

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-card border border-border-subtle bg-surface">
                <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
                  <h2 className="text-[15px] font-semibold text-foreground">Latest sessions</h2>
                  <Link
                    href="/dashboard/sessions"
                    className="text-[12px] text-accent-soft underline-offset-4 hover:underline"
                  >
                    All sessions
                  </Link>
                </div>

                {sessions.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={Layers}
                      title="No sessions yet"
                      description="Your first session will show the market schedule, the right package price and the call reference on one page."
                      actions={
                        <Button asChild size="sm">
                          <Link href="/dashboard/sessions/new">Create session</Link>
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-border-subtle">
                    {sessions.map((session) => (
                      <li key={session.id}>
                        <Link
                          href={`/dashboard/sessions/${session.id}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-surface-elevated/60"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-medium text-foreground">
                              {session.title}
                            </span>
                            <span className="mt-0.5 block text-[11.5px] text-muted">
                              {session.marketName} · {formatDateOnly(session.sessionDate)} ·{" "}
                              {session.selectedNicheLabel ?? "General session"}
                            </span>
                          </span>
                          <span className="text-[12.5px] font-semibold text-foreground">
                            {session.snapshot.recommendedPackage
                              ? formatMoney(
                                  session.snapshot.recommendedPackage.priceAmount,
                                  {
                                    currencyCode: session.currencyCode,
                                    currencyLabel: session.currencyLabel,
                                  },
                                  {
                                    isStartingPrice:
                                      session.snapshot.recommendedPackage.isStartingPrice,
                                  },
                                )
                              : "—"}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-card border border-border-subtle bg-surface p-4">
                  <h2 className="text-[13px] font-semibold text-foreground">Guide data</h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                    {guides.length} markets · {totalNiches} niche categories ·{" "}
                    {guides.reduce((total, guide) => total + guide.packages.length, 0)} packages
                  </p>
                  <Button asChild size="sm" variant="secondary" className="mt-3">
                    <Link href="/dashboard/settings/guide-data">
                      <Tags aria-hidden="true" />
                      Manage guide data
                    </Link>
                  </Button>
                </div>

                <div className="rounded-card border border-border-subtle bg-surface p-4">
                  <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    <Sparkles className="size-3.5 text-accent-soft" aria-hidden="true" />
                    What lives here
                  </h2>
                  <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                    Pricing and sessions feed the published Call Playbooks. A lead links its calls,
                    follow-ups and quotations together, and Analytics and Automation read those same
                    records — saved sessions keep the guide data they were created with.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/leads">Leads</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/callbooks">Call Playbooks</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/quotes">Quotes</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/analytics">Analytics</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}