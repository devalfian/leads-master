import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadFilters, type LeadFilterValues } from "@/components/leads/lead-filters";
import { LeadCards, LeadPagination, LeadTable } from "@/components/leads/lead-list";
import { listLeads, type LeadListFilters } from "@/lib/leads/repository";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/types";
import { loadCallbookMarketOptions } from "@/lib/callbooks/guide-options";
import type { CallbookMarketOption } from "@/lib/callbooks/types";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leads" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function buildLeadsHref(values: LeadFilterValues, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["q", "market", "niche", "status", "follow", "website", "contact", "sort"] as const) {
    if (values[key]) params.set(key, values[key]);
  }
  if (values.archived) params.set("archived", "1");
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/leads?${query}` : "/leads";
}

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const values: LeadFilterValues = {
    q: single(params.q).trim(),
    market: single(params.market),
    niche: single(params.niche),
    status: single(params.status),
    follow: single(params.follow),
    website: single(params.website),
    contact: single(params.contact),
    sort: single(params.sort) || "updated",
    archived: single(params.archived) === "1",
  };
  const page = Math.max(Number(single(params.page)) || 1, 1);

  let markets: CallbookMarketOption[] = [];
  let result: Awaited<ReturnType<typeof listLeads>> = { leads: [], total: 0, page, pageSize: 25 };
  let error: string | null = null;

  try {
    const filters: LeadListFilters = {
      query: values.q,
      marketCode: values.market || null,
      nicheCategoryId: values.niche || null,
      status: LEAD_STATUSES.includes(values.status as LeadStatus)
        ? (values.status as LeadStatus)
        : null,
      followUp: ["scheduled", "due", "overdue", "none"].includes(values.follow)
        ? (values.follow as LeadListFilters["followUp"])
        : null,
      website: values.website === "known" || values.website === "unknown" ? values.website : null,
      contact: values.contact === "never" || values.contact === "contacted" ? values.contact : null,
      includeArchived: values.archived,
      sort: values.sort as LeadListFilters["sort"],
      page,
    };
    [markets, result] = await Promise.all([loadCallbookMarketOptions(), listLeads(filters)]);
  } catch (loadError) {
    error = describeDataError(loadError, "Your leads could not be loaded. Try again.");
  }

  const totalPages = Math.max(Math.ceil(result.total / result.pageSize), 1);
  const filtered = Boolean(
    values.q || values.market || values.niche || values.status || values.follow ||
      values.website || values.contact,
  );

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace" }, { label: "Leads" }]}
        title="Leads"
        description={
          result.total === 0
            ? "Businesses you want to call, with their contact details, call history and follow-ups."
            : `${result.total} lead${result.total === 1 ? "" : "s"}${filtered ? " matching these filters" : ""}. Page ${result.page} of ${totalPages}.`
        }
        actions={
          <Button asChild>
            <Link href="/leads/new">
              <Plus aria-hidden="true" />
              Add lead
            </Link>
          </Button>
        }
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="Leads could not be loaded">
            {error}
          </Alert>
        ) : (
          <>
            <LeadFilters markets={markets} values={values} />
            {result.total === 0 ? (
              <EmptyState
                icon={Users}
                title={filtered ? "No leads match these filters" : "Your lead list is empty"}
                description={
                  filtered
                    ? "Try a different search term, market or status, or clear the filters."
                    : "Add a business to start organizing your outreach."
                }
                actions={
                  filtered ? (
                    <Button asChild variant="secondary">
                      <Link href="/leads">Clear filters</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/leads/new">
                        <Plus aria-hidden="true" />
                        Add your first lead
                      </Link>
                    </Button>
                  )
                }
              />
            ) : (
              <>
                <LeadTable result={result} />
                <LeadCards result={result} />
                <LeadPagination
                  page={result.page}
                  totalPages={totalPages}
                  hrefFor={(target) => buildLeadsHref(values, target)}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}