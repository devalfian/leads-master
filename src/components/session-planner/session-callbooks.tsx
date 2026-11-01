import Link from "next/link";
import { Phone, Plus, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CallbookSummary } from "@/lib/callbooks/types";
import type { SessionDetail as PlannerSession } from "@/lib/guides/types";

/**
 * Callbooks that match a saved session, so the call can be started with the
 * session's frozen pricing as context.
 *
 * Matching is conservative: same market, and a same-niche callbook is ranked first.
 * A callbook for another market is never suggested.
 */
export function SessionCallbooks({
  session,
  callbooks,
}: {
  session: PlannerSession;
  callbooks: CallbookSummary[];
}) {
  const marketCode = session.snapshot.market.code;
  const nicheName = session.selectedNicheLabel;

  const matching = callbooks
    .filter((callbook) => callbook.marketCode === marketCode && callbook.status !== "archived")
    .sort((a, b) => {
      const aNiche = nicheName && a.nicheName === nicheName ? 1 : 0;
      const bNiche = nicheName && b.nicheName === nicheName ? 1 : 0;
      if (aNiche !== bNiche) return bNiche - aNiche;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 5);

  return (
    <section className="rounded-card border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Callbooks for this session</h2>
          <p className="text-[12px] text-muted">
            {session.snapshot.market.name}
            {nicheName ? ` · ${nicheName}` : " · no niche selected"}
          </p>
        </div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/callbooks">All Callbooks</Link>
        </Button>
      </div>

      {matching.length === 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[12.5px] leading-relaxed text-secondary">
            No Callbook is linked to {session.snapshot.market.name} yet. Create one from a template to
            prepare this market&apos;s conversation.
          </p>
          <Button asChild size="sm" variant="secondary">
            <Link href="/callbooks/new?method=template">
              <Plus aria-hidden="true" />
              Create a Callbook
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border-subtle">
          {matching.map((callbook) => {
            const nicheMatch = Boolean(nicheName && callbook.nicheName === nicheName);
            return (
              <li key={callbook.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-foreground">
                    <span className="truncate">{callbook.title}</span>
                    {nicheMatch ? <Badge tone="accent">niche match</Badge> : null}
                    {callbook.nicheName ? (
                      <Badge tone="neutral">{callbook.nicheName}</Badge>
                    ) : null}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
                    <span>
                      {callbook.nodeCount} step{callbook.nodeCount === 1 ? "" : "s"} ·{" "}
                      {callbook.publishedVersion > 0
                        ? `published v${callbook.publishedVersion}`
                        : "not published yet"}
                    </span>
                    {callbook.publishedVersion === 0 ? (
                      <span className="flex items-center gap-1 text-warning">
                        <TriangleAlert className="size-3" aria-hidden="true" />
                        publish before starting a call
                      </span>
                    ) : null}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/callbooks/${callbook.id}?context=${session.id}`}>
                      <Phone aria-hidden="true" />
                      Open for this session
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/callbooks/${callbook.id}`}>Builder</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        Starting a call from here shows this session&apos;s frozen prices in Live Call Mode. Nothing is
        sent to the prospect.
      </p>
    </section>
  );
}