import { Badge } from "@/components/ui/badge";
import { formatMinorUnits } from "@/lib/quotes/money";
import { LEAD_STATUS_LABELS } from "@/lib/leads/types";
import type { MarketBreakdown, NicheBreakdown, Rate } from "@/lib/analytics/types";
import type { LeadStatus } from "@/lib/leads/types";

function rateLabel(rate: Rate): string {
  return rate.value === null ? "N/A" : `${rate.value.toFixed(0)}%`;
}

function rateTitle(rate: Rate): string {
  return rate.denominator === 0
    ? "No quotation in this market has a recorded acceptance or rejection."
    : `${rate.numerator} of ${rate.denominator} decided quotations accepted.`;
}

function amountSummary(rows: MarketBreakdown["outstanding"]): string {
  if (rows.length === 0) return "—";
  return rows
    .map((row) =>
      formatMinorUnits(row.amountMinor, {
        currencyCode: row.currencyCode,
        currencyLabel: row.currencyLabel,
      }),
    )
    .join(" · ");
}

/**
 * Per-market activity and outcomes.
 *
 * Call volume is shown next to every rate so a 100% acceptance rate from two
 * quotations is visibly a two-quotation sample, not a performance claim.
 */
export function MarketBreakdownTable({ rows }: { rows: MarketBreakdown[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[12.5px] text-secondary">
        No market activity in this period. Nothing is inferred from lead names.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-muted">
            <th className="py-2 pr-2 font-medium">Market</th>
            <th className="px-2 py-2 text-right font-medium">Calls</th>
            <th className="px-2 py-2 text-right font-medium">Conversations</th>
            <th className="px-2 py-2 text-right font-medium">Interested</th>
            <th className="px-2 py-2 text-right font-medium">Quotes created</th>
            <th className="px-2 py-2 text-right font-medium">Accepted</th>
            <th className="px-2 py-2 text-right font-medium">Acceptance</th>
            <th className="py-2 pl-2 text-right font-medium">Outstanding quoted value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.marketCode} className="border-b border-border-subtle/60 last:border-b-0">
              <td className="py-2 pr-2">
                <span className="text-foreground">{row.marketName}</span>
                <span className="ml-1.5 text-[11px] text-muted">{row.marketCode}</span>
              </td>
              <td className="px-2 py-2 text-right text-secondary">{row.calls}</td>
              <td className="px-2 py-2 text-right text-secondary">{row.conversations}</td>
              <td className="px-2 py-2 text-right text-secondary">{row.interestedLeads}</td>
              <td className="px-2 py-2 text-right text-secondary">{row.quotesCreated}</td>
              <td className="px-2 py-2 text-right text-secondary">{row.quotesAccepted}</td>
              <td className="px-2 py-2 text-right" title={rateTitle(row.acceptance)}>
                <span className={row.acceptance.value === null ? "text-muted" : "text-foreground"}>
                  {rateLabel(row.acceptance)}
                </span>
                <span className="ml-1 text-[11px] text-muted">
                  ({row.acceptance.denominator})
                </span>
              </td>
              <td className="py-2 pl-2 text-right text-secondary">{amountSummary(row.outstanding)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Per-niche outreach volume. Rendered only when the data actually has niches. */
export function NicheBreakdownTable({ rows }: { rows: NicheBreakdown[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[12.5px] text-secondary">
        No niche-tagged activity in this period. Leads without a niche are grouped nowhere rather than
        guessed from the business name.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.nicheName} className="flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-[12.5px] text-secondary">{row.nicheName}</span>
          <span className="shrink-0 text-[12px] text-muted">
            {row.calls} calls · {row.conversations} conversations · {row.interestedLeads} interested
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Current pipeline snapshot, labelled as such: it counts the leads that are in
 * each stage *now*, and is not a historical conversion funnel.
 */
export function StageDistribution({
  rows,
  activeLeads,
}: {
  rows: Array<{ status: LeadStatus; count: number }>;
  activeLeads: number;
}) {
  const visible = rows.filter((row) => row.count > 0);

  if (visible.length === 0) {
    return <p className="text-[12.5px] text-secondary">No active leads right now.</p>;
  }

  return (
    <div>
      <p className="text-[11.5px] text-muted">
        {activeLeads} active lead{activeLeads === 1 ? "" : "s"} — current stage, not a conversion
        funnel.
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {visible.map((row) => (
          <li key={row.status}>
            <Badge tone="neutral">
              {LEAD_STATUS_LABELS[row.status]} · {row.count}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}