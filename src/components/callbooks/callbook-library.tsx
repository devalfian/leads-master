"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StartCallDialog } from "@/components/callbooks/start-call-dialog";
import { CallbookCard, CallbookRow } from "@/components/callbooks/callbook-row";
import { apiPost } from "@/lib/api/client";
import { CALLBOOK_GOAL_LABELS, type CallbookSummary } from "@/lib/callbooks/types";
import { pluralise } from "@/lib/utils";

type StatusFilter = "all" | "draft" | "published" | "archived";
type SortKey = "recent" | "alphabetical";

export function CallbookLibrary({ callbooks }: { callbooks: CallbookSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [marketFilter, setMarketFilter] = useState("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startCallTarget, setStartCallTarget] = useState<CallbookSummary | null>(null);

  // Options are derived from the Callbooks themselves (which carry the guide
  // labels), so the library never keeps its own market/niche catalog.
  const marketOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const callbook of callbooks) {
      if (callbook.marketCode) seen.set(callbook.marketCode, callbook.marketName ?? callbook.marketCode);
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [callbooks]);

  const nicheOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const callbook of callbooks) {
      if (callbook.nicheName) seen.add(callbook.nicheName);
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [callbooks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = callbooks.filter((callbook) => {
      if (statusFilter !== "all" && callbook.status !== statusFilter) return false;
      if (marketFilter !== "all" && (callbook.marketCode ?? "none") !== marketFilter) return false;
      if (nicheFilter !== "all" && (callbook.nicheName ?? "none") !== nicheFilter) return false;
      if (!needle) return true;
      return (
        callbook.title.toLowerCase().includes(needle) ||
        callbook.targetAudience.toLowerCase().includes(needle) ||
        (callbook.marketName ?? "").toLowerCase().includes(needle) ||
        (callbook.nicheName ?? "").toLowerCase().includes(needle) ||
        CALLBOOK_GOAL_LABELS[callbook.primaryGoal].toLowerCase().includes(needle)
      );
    });

    return [...filtered].sort((a, b) =>
      sort === "alphabetical"
        ? a.title.localeCompare(b.title)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [callbooks, query, statusFilter, marketFilter, nicheFilter, sort]);

  async function runAction(callbook: CallbookSummary, action: "duplicate" | "archive" | "restore") {
    setBusy({ id: callbook.id, action });
    setError(null);

    const endpoint =
      action === "duplicate"
        ? `/api/callbooks/${callbook.id}/duplicate`
        : `/api/callbooks/${callbook.id}/archive`;
    const body = action === "duplicate" ? undefined : { archived: action === "archive" };

    const result = await apiPost(endpoint, body);
    setBusy(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  if (callbooks.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Build your first Callbook"
        description="Prepare what to say, anticipate prospect responses, and know how to continue the conversation — before you dial."
        actions={
          <>
            <Button asChild>
              <Link href="/callbooks/new?method=scratch">
                <Plus aria-hidden="true" />
                Create from scratch
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/callbooks/new?method=template">Explore templates</Link>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, audience or goal"
            aria-label="Search Callbooks"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="market-filter">
            Filter by market
          </label>
          <Select
            id="market-filter"
            value={marketFilter}
            onChange={(event) => setMarketFilter(event.target.value)}
            className="w-[150px]"
          >
            <option value="all">All markets</option>
            {marketOptions.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
            <option value="none">No market set</option>
          </Select>

          <label className="sr-only" htmlFor="niche-filter">
            Filter by niche
          </label>
          <Select
            id="niche-filter"
            value={nicheFilter}
            onChange={(event) => setNicheFilter(event.target.value)}
            className="w-[170px]"
          >
            <option value="all">All niches</option>
            {nicheOptions.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
            <option value="none">No niche set</option>
          </Select>

          <label className="sr-only" htmlFor="status-filter">
            Filter by status
          </label>
          <Select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="w-[140px]"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>

          <label className="sr-only" htmlFor="sort-order">
            Sort Callbooks
          </label>
          <Select
            id="sort-order"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="w-[170px]"
          >
            <option value="recent">Recently updated</option>
            <option value="alphabetical">Alphabetical</option>
          </Select>
        </div>
      </div>

      {error ? <Alert tone="danger" title="That action did not complete">{error}</Alert> : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No Callbooks match these filters"
          description="Try a different search term or status, or clear the filters to see everything."
          actions={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setMarketFilter("all");
                setNicheFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-card border border-border-subtle bg-surface md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Callbook</th>
                  <th scope="col" className="px-3 py-3 font-medium">Goal</th>
                  <th scope="col" className="px-3 py-3 font-medium">Steps</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="px-3 py-3 font-medium">Updated</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((callbook) => (
                  <CallbookRow
                    key={callbook.id}
                    callbook={callbook}
                    busyAction={busy?.id === callbook.id ? busy.action : null}
                    onDuplicate={() => runAction(callbook, "duplicate")}
                    onArchiveToggle={() =>
                      runAction(callbook, callbook.status === "archived" ? "restore" : "archive")
                    }
                    onStartCall={() => setStartCallTarget(callbook)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {visible.map((callbook) => (
              <CallbookCard
                key={callbook.id}
                callbook={callbook}
                busyAction={busy?.id === callbook.id ? busy.action : null}
                onDuplicate={() => runAction(callbook, "duplicate")}
                onArchiveToggle={() =>
                  runAction(callbook, callbook.status === "archived" ? "restore" : "archive")
                }
                onStartCall={() => setStartCallTarget(callbook)}
              />
            ))}
          </div>

          <p className="text-xs text-muted">
            Showing {pluralise(visible.length, "Callbook")} of {callbooks.length}.
          </p>
        </>
      )}

      {startCallTarget ? (
        <StartCallDialog
          callbookId={startCallTarget.id}
          callbookTitle={startCallTarget.title}
          publishedVersion={startCallTarget.publishedVersion}
          open
          onOpenChange={(open) => {
            if (!open) setStartCallTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}