"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Copy, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiDelete, apiPost } from "@/lib/api/client";
import { formatMoney } from "@/lib/guides/currency";
import { formatDateOnly, formatWibRange } from "@/lib/guides/format";
import type { SessionDetail } from "@/lib/guides/types";

/** Saved sessions: filter, open, duplicate and delete. */
export function SessionList({ sessions }: { sessions: SessionDetail[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SessionDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markets = useMemo(() => {
    const seen = new Map<string, string>();
    for (const session of sessions) seen.set(session.marketCode, session.marketName);
    return [...seen.entries()];
  }, [sessions]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sessions.filter((session) => {
      if (market !== "all" && session.marketCode !== market) return false;
      if (from && session.sessionDate < from) return false;
      if (to && session.sessionDate > to) return false;
      if (!needle) return true;
      return (
        session.title.toLowerCase().includes(needle) ||
        (session.selectedNicheLabel ?? "").toLowerCase().includes(needle) ||
        session.objective.toLowerCase().includes(needle)
      );
    });
  }, [sessions, query, market, from, to]);

  async function duplicate(session: SessionDetail) {
    setBusyId(session.id);
    setError(null);
    const result = await apiPost<{ session: { id: string } }>(
      `/api/sessions/${session.id}/duplicate`,
    );
    setBusyId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push(`/dashboard/sessions/${result.data.session.id}`);
    router.refresh();
  }

  async function remove(session: SessionDetail): Promise<string | null> {
    const result = await apiDelete(`/api/sessions/${session.id}`);
    if (!result.ok) return result.error.message;
    router.refresh();
    return null;
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No calling sessions yet"
        description="Create a session to get its schedule, pricing and call reference."
        actions={
          <Button asChild>
            <Link href="/dashboard/sessions/new">
              <Plus aria-hidden="true" />
              Create session
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-card border border-border-subtle bg-surface p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, niche or objective"
            className="pl-8"
            aria-label="Search sessions"
          />
        </div>
        <Select
          value={market}
          onChange={(event) => setMarket(event.target.value)}
          aria-label="Filter by market"
          className="md:w-44"
        >
          <option value="all">All markets</option>
          {markets.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            aria-label="From date"
            className="md:w-36"
          />
          <span className="text-[12px] text-muted">to</span>
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            aria-label="To date"
            className="md:w-36"
          />
        </div>
      </div>

      {error ? <Alert tone="danger" title="That action did not complete">{error}</Alert> : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No sessions match these filters"
          description="Try a different market, search term or date range."
          actions={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setMarket("all");
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((session) => (
            <li
              key={session.id}
              className="rounded-card border border-border-subtle bg-surface p-4 transition-colors hover:border-accent-soft/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/sessions/${session.id}`}
                    className="block truncate text-[15px] font-semibold text-foreground hover:text-accent-soft"
                  >
                    {session.title}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted">
                    <span>{session.marketName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateOnly(session.sessionDate)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" aria-hidden="true" />
                      {session.snapshot.schedule
                        ? formatWibRange(
                            session.snapshot.schedule.startTimeWib,
                            session.snapshot.schedule.endTimeWib,
                            session.snapshot.schedule.timezoneLabel,
                          )
                        : "No schedule"}
                    </span>
                  </p>
                </div>
                <Badge tone="neutral">{session.marketCode}</Badge>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12.5px] text-secondary">
                  {session.selectedNicheLabel ?? "General session"}
                </div>
                <div className="text-[13px] font-semibold text-foreground">
                  {session.snapshot.recommendedPackage
                    ? formatMoney(
                        session.snapshot.recommendedPackage.priceAmount,
                        {
                          currencyCode: session.currencyCode,
                          currencyLabel: session.currencyLabel,
                        },
                        { isStartingPrice: session.snapshot.recommendedPackage.isStartingPrice },
                      )
                    : "—"}
                  <span className="ml-1 text-[11px] font-normal text-muted">
                    {session.snapshot.recommendedPackage?.name ?? ""}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/dashboard/sessions/${session.id}`}>Open</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => duplicate(session)}
                  loading={busyId === session.id}
                >
                  <Copy aria-hidden="true" />
                  Duplicate
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(session)}
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[12px] text-muted">
        Showing {visible.length} of {sessions.length} saved sessions.
      </p>

      {deleteTarget ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Delete this session?"
          description={`“${deleteTarget.title}” will be removed.`}
          consequence="The saved snapshot is deleted with it. Master pricing data is not affected."
          confirmLabel="Delete session"
          onConfirm={() => remove(deleteTarget)}
        />
      ) : null}
    </div>
  );
}