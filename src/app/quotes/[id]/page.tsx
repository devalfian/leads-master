import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/quotes/quote-badges";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { QuoteDocument } from "@/components/quotes/quote-document";
import { QuotePriceDriftNotice } from "@/components/quotes/quote-price-drift";
import { getQuote } from "@/lib/quotes/repository";
import { getMarketGuideById } from "@/lib/guides/repository";
import { formatMoney } from "@/lib/guides/currency";
import { formatMinorUnits } from "@/lib/quotes/money";
import { formatDateOnly, formatTimestampDate } from "@/lib/guides/format";
import { formatDateTime } from "@/lib/utils";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/types";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let quote: Awaited<ReturnType<typeof getQuote>> = null;
  let error: string | null = null;

  try {
    quote = await getQuote(id);
  } catch (loadError) {
    error = describeDataError(loadError, "This quotation could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="This quotation could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (!quote) notFound();

  const guide = quote.marketId
    ? await getMarketGuideById(quote.marketId).catch(() => null)
    : null;
  const marketPackages = (guide?.packages ?? [])
    .filter((product) => product.isActive)
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const currency = { currencyCode: quote.currencyCode, currencyLabel: quote.currencyLabel };

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Quotes", href: "/quotes" },
          { label: quote.quoteNumber },
        ]}
        title={quote.quoteNumber}
        description={[quote.leadBusinessName, quote.projectTitle].filter(Boolean).join(" · ")}
        meta={
          <>
            <QuoteStatusBadge status={quote.displayStatus} />
            <Badge tone="neutral">{quote.currencyCode}</Badge>
            {quote.marketName ? <Badge tone="info">{quote.marketName}</Badge> : null}
            {quote.nicheLabel ? <Badge tone="neutral">{quote.nicheLabel}</Badge> : null}
          </>
        }
        actions={<QuoteActions quoteId={quote.id} status={quote.status} />}
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        <QuotePriceDriftNotice
          quoteId={quote.id}
          drift={quote.priceDrift}
          currencyCode={quote.currencyCode}
          currencyLabel={quote.currencyLabel}
        />

        {quote.status !== "draft" ? (
          <Alert tone="info" title="This quotation is a historical record">
            It is kept exactly as it was when it was marked as {QUOTE_STATUS_LABELS[quote.status]}.
            Prices, line items and client details are no longer editable — duplicate it to quote the
            work again.
          </Alert>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <QuoteDocument quote={quote} />
          </div>

          <div className="space-y-4 print:hidden">
            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <h2 className="text-[13px] font-semibold text-foreground">Quotation details</h2>
              <dl className="mt-2 space-y-1.5 text-[12px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Total</dt>
                  <dd className="font-medium text-foreground">
                    {formatMinorUnits(quote.totalMinor, currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Package</dt>
                  <dd className="text-secondary">{quote.packageSnapshot?.name ?? "Custom scope"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Created</dt>
                  <dd className="text-secondary">{formatTimestampDate(quote.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Valid until</dt>
                  <dd className="text-secondary">
                    {quote.validUntil ? formatDateOnly(quote.validUntil) : "Not stated"}
                  </dd>
                </div>
                {quote.sentAt ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Marked sent</dt>
                    <dd className="text-secondary">{formatTimestampDate(quote.sentAt)}</dd>
                  </div>
                ) : null}
                {quote.acceptedAt ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Accepted</dt>
                    <dd className="text-success">{formatTimestampDate(quote.acceptedAt)}</dd>
                  </div>
                ) : null}
                {quote.rejectedAt ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Rejected</dt>
                    <dd className="text-danger">{formatTimestampDate(quote.rejectedAt)}</dd>
                  </div>
                ) : null}
                {quote.cancelledAt ? (
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted">Cancelled</dt>
                    <dd className="text-secondary">{formatTimestampDate(quote.cancelledAt)}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/leads/${quote.leadId}`}>
                    <ArrowLeft aria-hidden="true" />
                    Open lead
                  </Link>
                </Button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                An accepted quotation is not revenue: no payment record exists in this application.
              </p>
            </section>

            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <h2 className="text-[13px] font-semibold text-foreground">Status history</h2>
              <ol className="mt-2 space-y-2 border-l border-border-subtle pl-3 text-[12px]">
                {quote.statusEvents.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className="absolute -left-[17px] top-1.5 size-2 rounded-full bg-accent-soft"
                      aria-hidden="true"
                    />
                    <p className="text-secondary">
                      {event.fromStatus
                        ? `${QUOTE_STATUS_LABELS[event.fromStatus]} → ${QUOTE_STATUS_LABELS[event.toStatus]}`
                        : QUOTE_STATUS_LABELS[event.toStatus]}
                    </p>
                    <p className="text-[11px] text-muted">{formatDateTime(event.createdAt)}</p>
                    {event.note ? (
                      <p className="mt-0.5 text-[11.5px] text-secondary">{event.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <h2 className="text-[13px] font-semibold text-foreground">
                {quote.marketName ?? "Market"} packages
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">
                Current Pricing Library references. The quotation itself keeps the amounts it was
                saved with.
              </p>
              {marketPackages.length === 0 ? (
                <p className="mt-2 text-[12px] text-secondary">No packages are configured.</p>
              ) : (
                <ul className="mt-2 space-y-1.5 text-[12px]">
                  {marketPackages.map((product) => (
                    <li key={product.id} className="flex justify-between gap-2">
                      <span className="text-secondary">{product.name}</span>
                      <span className="text-foreground">
                        {formatMoney(product.priceAmount, currency, {
                          isStartingPrice: product.isStartingPrice,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild size="sm" variant="ghost" className="mt-3">
                <Link href={`/dashboard/pricing/${quote.marketCode ?? ""}`}>Open Pricing Library</Link>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}