import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select } from "@/components/ui/field";
import { QuoteCards, QuotePagination, QuoteTable } from "@/components/quotes/quote-list";
import { listQuotes, getQuoteStats, type QuoteListFilters } from "@/lib/quotes/repository";
import { QUOTE_STATUS_LABELS, QUOTE_STATUSES } from "@/lib/quotes/types";
import { listMarkets } from "@/lib/guides/repository";
import { formatMinorUnits } from "@/lib/quotes/money";
import type { Market } from "@/lib/guides/types";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Quotes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildHref(values: { q: string; status: string; market: string }, page: number): string {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.status) params.set("status", values.status);
  if (values.market) params.set("market", values.market);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/quotes?${query}` : "/quotes";
}

export default async function QuotesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const values = {
    q: single(params.q).trim(),
    status: single(params.status),
    market: single(params.market),
  };
  const page = Math.max(Number(single(params.page)) || 1, 1);

  let markets: Market[] = [];
  let result: Awaited<ReturnType<typeof listQuotes>> = {
    quotes: [],
    total: 0,
    page,
    pageSize: 25,
  };
  let stats: Awaited<ReturnType<typeof getQuoteStats>> | null = null;
  let error: string | null = null;

  try {
    const filters: QuoteListFilters = {
      query: values.q || undefined,
      status: (QUOTE_STATUSES as readonly string[]).includes(values.status) ? values.status : null,
      marketCode: values.market || null,
      page,
    };
    [markets, result, stats] = await Promise.all([
      listMarkets(),
      listQuotes(filters),
      getQuoteStats(),
    ]);
  } catch (loadError) {
    error = describeDataError(loadError, "Your quotations could not be loaded. Try again.");
  }

  const totalPages = Math.max(Math.ceil(result.total / result.pageSize), 1);
  const filtered = Boolean(values.q || values.status || values.market);

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace" }, { label: "Quotes" }]}
        title="Quotes"
        description="Create, manage and track website proposals. Amounts come from the Pricing Library, and a saved quotation keeps the prices it was created with."
        actions={
          <Button asChild>
            <Link href="/quotes/new">
              <Plus aria-hidden="true" />
              Create quote
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="Quotations could not be loaded">
            {error}
          </Alert>
        ) : (
          <>
            {stats ? (
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-card border border-border-subtle bg-surface p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted">All quotes</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{stats.total}</p>
                </div>
                <div className="rounded-card border border-border-subtle bg-surface p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted">Drafts</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{stats.draft}</p>
                </div>
                <div className="rounded-card border border-border-subtle bg-surface p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted">Sent</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{stats.sent}</p>
                </div>
                <div className="rounded-card border border-border-subtle bg-surface p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted">Accepted</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{stats.accepted}</p>
                </div>
                <div className="rounded-card border border-border-subtle bg-surface p-3.5">
                  <p className="text-[11px] uppercase tracking-wider text-muted">Expiring soon</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{stats.expiringSoon}</p>
                </div>
              </section>
            ) : null}
{stats && stats.quotedByCurrency.length > 0 ? (
              <section className="rounded-card border border-border-subtle bg-surface p-3.5">
                <p className="text-[11px] uppercase tracking-wider text-muted">
                  Quoted value — never summed across currencies
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-2">
                  {stats.quotedByCurrency.map((entry) => (
                    <li key={entry.currencyCode}>
                      <Badge tone="neutral">
                        {entry.quoteCount} × {formatMinorUnits(entry.amountMinor, entry)}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[11px] text-muted">
                  Quoted value is not revenue. This application records no payments, so no amount here
                  is money received.
                </p>
              </section>
            ) : null}

            <form
              action="/quotes"
              method="get"
              className="rounded-card border border-border-subtle bg-surface p-4"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quote-q">Search</Label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <Input
                      id="quote-q"
                      name="q"
                      defaultValue={values.q}
                      placeholder="Quote number, business or project"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-status">Status</Label>
                  <Select id="quote-status" name="status" defaultValue={values.status}>
                    <option value="">All statuses</option>
                    {QUOTE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {QUOTE_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quote-market">Market</Label>
                  <Select id="quote-market" name="market" defaultValue={values.market}>
                    <option value="">All markets</option>
                    {markets.map((market) => (
                      <option key={market.code} value={market.code}>
                        {market.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="submit" variant="secondary" size="sm">
                  Apply filters
                </Button>
                {filtered ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/quotes">Clear</Link>
                  </Button>
                ) : null}
              </div>
            </form>

            {result.total === 0 ? (
              <EmptyState
                icon={FileText}
                title={filtered ? "No quotes match these filters" : "No quotes yet"}
                description={
                  filtered
                    ? "Try a different status, market or search term."
                    : "Create your first professional quotation from an existing lead."
                }
                actions={
                  filtered ? (
                    <Button asChild variant="secondary">
                      <Link href="/quotes">Clear filters</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/quotes/new">
                        <Plus aria-hidden="true" />
                        Create your first quote
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <QuoteTable result={result} />
                <QuoteCards result={result} />
                <QuotePagination
                  page={result.page}
                  totalPages={totalPages}
                  hrefFor={(target) => buildHref(values, target)}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}