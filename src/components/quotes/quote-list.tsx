import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/quotes/quote-badges";
import { formatMinorUnits } from "@/lib/quotes/money";
import type { QuoteSummary } from "@/lib/quotes/types";
import { formatTimestampDate } from "@/lib/guides/format";

type QuoteListResult = {
  quotes: QuoteSummary[];
  total: number;
  page: number;
  pageSize: number;
};

function totalLabel(quote: QuoteSummary): string {
  return formatMinorUnits(quote.totalMinor, {
    currencyCode: quote.currencyCode,
    currencyLabel: quote.currencyLabel,
  });
}

export function QuoteTable({ result }: { result: QuoteListResult }) {
  return (
    <div className="hidden overflow-hidden rounded-card border border-border-subtle bg-surface md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-2.5 font-medium">Quote</th>
              <th className="px-4 py-2.5 font-medium">Client</th>
              <th className="px-4 py-2.5 font-medium">Market</th>
              <th className="px-4 py-2.5 font-medium">Package</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
              <th className="px-4 py-2.5 font-medium">Valid until</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.quotes.map((quote) => (
              <tr key={quote.id} className="border-b border-border-subtle/60 last:border-b-0">
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link href={`/quotes/${quote.id}`} className="hover:text-accent-soft">
                    {quote.quoteNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-secondary">
                  <Link href={`/leads/${quote.leadId}`} className="hover:text-accent-soft">
                    {quote.leadBusinessName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-secondary">{quote.marketName ?? "—"}</td>
                <td className="px-4 py-3 text-secondary">
                  {quote.packageSnapshot?.name ?? quote.projectTitle}
                </td>
                <td className="px-4 py-3 text-right font-medium text-foreground">
                  {totalLabel(quote)}
                </td>
                <td className="px-4 py-3 text-muted">{formatTimestampDate(quote.createdAt)}</td>
                <td className="px-4 py-3 text-muted">
                  {quote.validUntil ? formatTimestampDate(quote.validUntil) : "—"}
                </td>
                <td className="px-4 py-3">
                  <QuoteStatusBadge status={quote.displayStatus} />
                </td>
                <td className="px-4 py-3">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/quotes/${quote.id}`}>Open</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function QuoteCards({ result }: { result: QuoteListResult }) {
  return (
    <ul className="space-y-3 md:hidden">
      {result.quotes.map((quote) => (
        <li key={quote.id} className="rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {quote.quoteNumber}
              </p>
              <p className="mt-0.5 truncate text-[12.5px] text-secondary">
                {quote.leadBusinessName}
              </p>
            </div>
            <QuoteStatusBadge status={quote.displayStatus} />
          </div>
          <p className="mt-2 text-[13px] text-secondary">
            {quote.packageSnapshot?.name ?? quote.projectTitle}
          </p>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{totalLabel(quote)}</p>
          <p className="mt-1 text-[11.5px] text-muted">
            {quote.marketName ?? "—"} · created {formatTimestampDate(quote.createdAt)}
            {quote.validUntil ? ` · valid until ${formatTimestampDate(quote.validUntil)}` : ""}
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link href={`/quotes/${quote.id}`}>
              Open quotation
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function QuotePagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-2 text-[12px]" aria-label="Pagination">
      {page > 1 ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={hrefFor(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={hrefFor(page + 1)}>Next</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}