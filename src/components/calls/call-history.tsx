"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, History, PhoneCall, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { OutcomeBadge } from "@/components/callbooks/status-badges";
import { LogCallDialog } from "@/components/leads/log-call-dialog";
import { OUTCOMES } from "@/lib/callbooks/outcomes";
import type { CallHistoryItem } from "@/lib/leads/repository";
import { formatDateTime, pluralise } from "@/lib/utils";

export type CallHistoryFiltersState = {
  q: string;
  market: string;
  source: string;
  outcome: string;
  from: string;
  to: string;
};

function businessLabel(item: CallHistoryItem): string {
  return item.leadName ?? item.prospectName ?? "Unnamed prospect";
}

function historyHref(filters: CallHistoryFiltersState, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["q", "market", "source", "outcome", "from", "to"] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/calls?${query}` : "/calls";
}

export function CallHistory({
  items,
  total,
  page,
  totalPages,
  markets,
  filters,
}: {
  items: CallHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
  markets: Array<{ code: string; name: string }>;
  filters: CallHistoryFiltersState;
}) {
  const [logTarget, setLogTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-4">
      <form
        action="/calls"
        method="get"
        className="rounded-card border border-border-subtle bg-surface p-4"
      >
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5 xl:col-span-2">
            <Label htmlFor="history-q">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                id="history-q"
                name="q"
                defaultValue={filters.q}
                placeholder="Business, Callbook or notes"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-market">Market</Label>
            <Select id="history-market" name="market" defaultValue={filters.market}>
              <option value="">All markets</option>
              {markets.map((market) => (
                <option key={market.code} value={market.code}>
                  {market.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-source">Call type</Label>
            <Select id="history-source" name="source" defaultValue={filters.source}>
              <option value="">Everything</option>
              <option value="session">Callbook runs</option>
              <option value="log">Logged calls</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-outcome">Outcome</Label>
            <Select id="history-outcome" name="outcome" defaultValue={filters.outcome}>
              <option value="">All outcomes</option>
              {OUTCOMES.map((outcome) => (
                <option key={outcome.key} value={outcome.key}>
                  {outcome.label}
                </option>
              ))}
              <option value="none">No outcome yet</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-from">From</Label>
            <Input id="history-from" type="date" name="from" defaultValue={filters.from} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history-to">To</Label>
            <Input id="history-to" type="date" name="to" defaultValue={filters.to} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm">
            Apply filters
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/calls">Clear</Link>
          </Button>
          <span className="text-[11.5px] text-muted">{pluralise(total, "call")} recorded</span>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={History}
          title="No calls recorded yet"
          description="Open a lead to log a call, or start from your Callbook. Finished Callbook calls and logged calls both appear here."
          actions={
            <Button asChild>
              <Link href="/leads">Go to leads</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="rounded-card border border-border-subtle bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-foreground">
                    {item.leadId ? (
                      <Link href={`/leads/${item.leadId}`} className="hover:text-accent-soft">
                        {businessLabel(item)}
                      </Link>
                    ) : (
                      businessLabel(item)
                    )}
                    <Badge tone={item.kind === "log" ? "info" : "neutral"}>
                      {item.kind === "log" ? "Logged call" : "Callbook run"}
                    </Badge>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {formatDateTime(item.at)}
                    {item.marketName ? ` · ${item.marketName}` : ""}
                    {item.nicheName ? ` · ${item.nicheName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <OutcomeBadge outcomeKey={item.outcomeKey} />
                  {item.status === "in_progress" ? <Badge tone="info">In progress</Badge> : null}
                </div>
              </div>

              <p className="mt-2 text-[12px] text-secondary">{item.title}</p>
              {item.notes.trim() ? (
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-secondary">
                  {item.notes}
                </p>
              ) : null}
              {item.followUpAt ? (
                <p className="mt-1 text-[11.5px] text-warning">
                  Follow-up {item.followUpAt.slice(0, 10)}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.kind === "session" ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/calls/${item.id}`}>
                      {item.status === "in_progress" ? "Resume" : "View call"}
                    </Link>
                  </Button>
                ) : item.leadId ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/leads/${item.leadId}`}>View lead</Link>
                  </Button>
                ) : null}
                {item.leadId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLogTarget({ id: item.leadId as string, name: businessLabel(item) })}
                  >
                    <PhoneCall aria-hidden="true" />
                    Log another call
                  </Button>
                ) : null}
                {item.leadId ? (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={
                        item.kind === "session"
                          ? `/quotes/new?lead=${item.leadId}&session=${item.id}`
                          : `/quotes/new?lead=${item.leadId}&call=${item.id}`
                      }
                    >
                      <FileText aria-hidden="true" />
                      Create quote
                    </Link>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-between gap-2 text-[12px]" aria-label="Pagination">
          {page > 1 ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={historyHref(filters, page - 1)}>Previous</Link>
            </Button>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={historyHref(filters, page + 1)}>Next</Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      {logTarget ? (
        <LogCallDialog
          leadId={logTarget.id}
          businessName={logTarget.name}
          doNotContact={false}
          open
          onOpenChange={(open) => {
            if (!open) setLogTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}