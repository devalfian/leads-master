import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CallHistory, type CallHistoryFiltersState } from "@/components/calls/call-history";
import { isOutcomeKey } from "@/lib/callbooks/outcomes";
import {
  listCallHistory,
  listCallHistoryFilterOptions,
  type CallHistoryFilters,
} from "@/lib/leads/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Call History" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CallHistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters: CallHistoryFiltersState = {
    q: single(params.q).trim(),
    market: single(params.market),
    source: single(params.source),
    outcome: single(params.outcome),
    from: single(params.from),
    to: single(params.to),
  };
  const page = Math.max(Number(single(params.page)) || 1, 1);

  let result: Awaited<ReturnType<typeof listCallHistory>> = {
    items: [],
    total: 0,
    page,
    pageSize: 25,
  };
  let markets: Array<{ code: string; name: string }> = [];
  let error: string | null = null;

  try {
    const filtersForQuery: CallHistoryFilters = {
      query: filters.q,
      marketCode: filters.market || null,
      source: filters.source === "session" || filters.source === "log" ? filters.source : "all",
      outcomeKey:
        filters.outcome === "none"
          ? "none"
          : isOutcomeKey(filters.outcome)
            ? filters.outcome
            : null,
      from: filters.from || null,
      to: filters.to || null,
      page,
    };
    [result, markets] = await Promise.all([
      listCallHistory(filtersForQuery),
      listCallHistoryFilterOptions().then((options) => options.markets),
    ]);
  } catch (loadError) {
    error = describeDataError(loadError, "Call history could not be loaded. Try again.");
  }

  const totalPages = Math.max(Math.ceil(result.total / result.pageSize), 1);

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace" }, { label: "Call History" }]}
        title="Call History"
        description="Every call in one place: finished Callbook runs and calls logged against a lead, with their outcome, notes and follow-up."
        actions={
          <Button asChild>
            <Link href="/leads">
              <PhoneCall aria-hidden="true" />
              Log a call
            </Link>
          </Button>
        }
      />

      <div className="px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="Call history could not be loaded">
            {error}
          </Alert>
        ) : (
          <CallHistory
            items={result.items}
            total={result.total}
            page={result.page}
            totalPages={totalPages}
            markets={markets}
            filters={filters}
          />
        )}
      </div>
    </div>
  );
}