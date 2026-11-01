import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Globe, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadHeaderActions } from "@/components/leads/lead-header-actions";
import { LeadFollowUps } from "@/components/leads/lead-follow-ups";
import { FollowUpLabel, LeadStatusBadge } from "@/components/leads/lead-badges";
import { OutcomeBadge } from "@/components/callbooks/status-badges";
import { getLeadDetail } from "@/lib/leads/repository";
import { listCallbooks } from "@/lib/callbooks/repository";
import { getMarketGuideById } from "@/lib/guides/repository";
import { listQuotesForLead } from "@/lib/quotes/repository";
import { QuoteStatusBadge } from "@/components/quotes/quote-badges";
import { formatMinorUnits } from "@/lib/quotes/money";
import { describeDataError } from "@/lib/data-error";
import { formatMoney } from "@/lib/guides/currency";
import { formatTimestampDate } from "@/lib/guides/format";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let lead: Awaited<ReturnType<typeof getLeadDetail>> = null;
  let error: string | null = null;

  try {
    lead = await getLeadDetail(id);
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

  const [guide, allCallbooks, leadQuotes] = await Promise.all([
    getMarketGuideById(lead.marketId).catch(() => null),
    listCallbooks().catch(() => []),
    listQuotesForLead(lead.id).catch(() => []),
  ]);

  const packages = (guide?.packages ?? []).map((product) => ({
    id: product.id,
    label: `${product.name} — ${formatMoney(product.priceAmount, {
      currencyCode: lead.currencyCode,
      currencyLabel: lead.currencyLabel,
    })}`,
  }));

  const publishedCallbooks = allCallbooks.filter(
    (callbook) =>
      callbook.marketCode === lead.marketCode &&
      callbook.status === "published" &&
      callbook.hasPublishedSnapshot,
  );
  const callbookOptions = publishedCallbooks.map((callbook) => ({
    id: callbook.id,
    title: callbook.title,
  }));

  const contactDetails = [
    { icon: Phone, label: lead.phone, href: lead.phone ? `tel:${lead.phone}` : null },
    { icon: Mail, label: lead.email, href: lead.email ? `mailto:${lead.email}` : null },
    { icon: Globe, label: lead.website, href: lead.website },
    {
      icon: MapPin,
      label: [lead.city, lead.address].filter(Boolean).join(", ") || null,
      href: null,
    },
  ].filter((entry) => Boolean(entry.label));

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Leads", href: "/leads" },
          { label: lead.businessName },
        ]}
        title={lead.businessName}
        description={[lead.marketName, lead.nicheName, lead.city].filter(Boolean).join(" · ")}
        meta={
          <>
            <LeadStatusBadge status={lead.status} />
            {lead.doNotContact ? <Badge tone="danger">Do not contact</Badge> : null}
            {lead.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
            {lead.contactRole ? <Badge tone="info">{lead.contactRole}</Badge> : null}
          </>
        }
        actions={
          <LeadHeaderActions
            leadId={lead.id}
            businessName={lead.businessName}
            doNotContact={lead.doNotContact}
            archived={Boolean(lead.archivedAt)}
            website={lead.website}
            packages={packages}
            callbooks={callbookOptions}
          />
        }
      />

      <div className="grid gap-4 px-5 py-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4"><section className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Business overview</h2>
            {contactDetails.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-muted">
                No contact details recorded yet. Add what you find in Edit lead.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {contactDetails.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <li key={String(entry.label)} className="flex items-center gap-2 text-[13px]">
                      <Icon className="size-3.5 text-muted" aria-hidden="true" />
                      {entry.href ? (
                        <a
                          href={entry.href}
                          className="text-secondary underline-offset-2 hover:text-accent-soft hover:underline"
                          target={entry.href.startsWith("http") ? "_blank" : undefined}
                          rel="noreferrer noopener"
                        >
                          {entry.label}
                        </a>
                      ) : (
                        <span className="text-secondary">{entry.label}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-[8px] border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                <dt className="text-[10.5px] uppercase tracking-wider text-muted">Contact</dt>
                <dd className="text-[12.5px] text-secondary">{lead.contactName ?? "Unknown"}</dd>
              </div>
              <div className="rounded-[8px] border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                <dt className="text-[10.5px] uppercase tracking-wider text-muted">Source</dt>
                <dd className="text-[12.5px] text-secondary">{lead.source ?? "Not recorded"}</dd>
              </div>
              <div className="rounded-[8px] border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                <dt className="text-[10.5px] uppercase tracking-wider text-muted">Estimated value</dt>
                <dd className="text-[12.5px] text-secondary">
                  {lead.estimatedValueAmount === null
                    ? "Not recorded"
                    : formatMoney(lead.estimatedValueAmount, {
                        currencyCode: lead.currencyCode,
                        currencyLabel: lead.currencyLabel,
                      })}
                </dd>
              </div>
            </dl>

            {lead.notes.trim() ? (
              <p className="mt-3 whitespace-pre-wrap rounded-[10px] border border-border-subtle bg-background/50 px-3 py-2 text-[12.5px] leading-relaxed text-secondary">
                {lead.notes}
              </p>
            ) : null}
          </section>

          <section className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Activity</h2>
            <p className="text-[12px] text-muted">
              Built only from stored records — calls logged, Callbook calls started, follow-ups and
              lead edits.
            </p>
            <ol className="mt-3 space-y-2.5">
              {lead.timeline.map((entry) => (
                <li key={entry.id} className="flex gap-3 border-l border-border-subtle pl-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-foreground">
                      {entry.href ? (
                        <Link href={entry.href} className="hover:text-accent-soft">
                          {entry.title}
                        </Link>
                      ) : (
                        entry.title
                      )}
                    </p>
                    {entry.detail ? (
                      <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                        {entry.detail}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted">{formatDateTime(entry.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {lead.calls.length > 0 ? (
            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <h2 className="text-[15px] font-semibold text-foreground">Recent calls</h2>
              <ul className="mt-2 divide-y divide-border-subtle">
                {lead.calls.slice(0, 5).map((call) => (
                  <li key={call.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <OutcomeBadge outcomeKey={call.outcomeKey} />
                      <span className="text-[11.5px] text-muted">
                        {formatTimestampDate(call.calledAt)}
                      </span>
                      {call.packageName ? <Badge tone="neutral">{call.packageName}</Badge> : null}
                    </div>
                    {call.notes ? (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-secondary">
                        {call.notes}
                      </p>
                    ) : null}
                    {call.followUpAt ? (
                      <p className="mt-1 text-[11.5px] text-warning">
                        Follow-up {call.followUpAt.slice(0, 10)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}</div>
        <div className="space-y-4"><LeadFollowUps leadId={lead.id} followUps={lead.followUps} doNotContact={lead.doNotContact} />

          <section className="rounded-card border border-border-subtle bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">Quotations</h2>
              <Button asChild size="sm" variant="ghost">
                <Link href={`/quotes/new?lead=${lead.id}`}>
                  <FileText aria-hidden="true" />
                  New
                </Link>
              </Button>
            </div>
            {leadQuotes.length === 0 ? (
              <p className="mt-2 text-[12px] leading-relaxed text-secondary">
                No quotation has been created for this lead yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {leadQuotes.map((quote) => (
                  <li key={quote.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="block truncate text-[12.5px] font-medium text-foreground hover:text-accent-soft"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <p className="text-[11.5px] text-muted">
                        {formatMinorUnits(quote.totalMinor, {
                          currencyCode: quote.currencyCode,
                          currencyLabel: quote.currencyLabel,
                        })}
                        {quote.packageSnapshot ? ` · ${quote.packageSnapshot.name}` : ""}
                      </p>
                    </div>
                    <QuoteStatusBadge status={quote.displayStatus} />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              A quotation records the prices it was created with; later catalog changes do not alter
              it.
            </p>
          </section>

          <section className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[15px] font-semibold text-foreground">Start a Callbook call</h2>
            {publishedCallbooks.length === 0 ? (
              <div className="mt-2 space-y-2">
                <p className="text-[12px] leading-relaxed text-secondary">
                  No published Callbook for {lead.marketName} yet. Calls can still be logged with the
                  button above.
                </p>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/callbooks/new?method=template">Create a Callbook</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {publishedCallbooks.slice(0, 5).map((callbook) => (
                  <li key={callbook.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[12.5px] text-secondary">
                      {callbook.title}
                    </span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/callbooks/${callbook.id}?lead=${lead.id}`}>Open</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              A Callbook call is recorded in history when you finish it. The business name is
              snapshotted with the call.
            </p>
          </section>

          <section className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="text-[13px] font-semibold text-foreground">Context</h2>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Market</dt>
                <dd className="text-secondary">
                  {lead.marketName} ({lead.currencyCode})
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Niche</dt>
                <dd className="text-secondary">{lead.nicheName ?? "No niche"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Last contact</dt>
                <dd className="text-secondary">
                  {lead.lastContactAt ? formatTimestampDate(lead.lastContactAt) : "Never"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Next follow-up</dt>
                <dd>
                  <FollowUpLabel dueAt={lead.nextFollowUpAt} />
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Calls logged</dt>
                <dd className="text-secondary">{lead.callCount}</dd>
              </div>
            </dl>
          </section></div>
      </div>
    </div>
  );
}