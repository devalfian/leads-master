import { formatPeriodDate } from "@/lib/analytics/period";
import type { TrendPoint } from "@/lib/analytics/types";

/**
 * Calls and conversations per WIB day.
 *
 * Rendered as plain bars (no charting dependency): the axis is always zero-based,
 * every bar carries a text tooltip, and a screen-reader table repeats the same
 * numbers so the chart is not the only way to read them.
 */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const peak = points.reduce((max, point) => Math.max(max, point.calls), 0);
  const totalCalls = points.reduce((total, point) => total + point.calls, 0);
  const totalConversations = points.reduce((total, point) => total + point.conversations, 0);

  if (totalCalls === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border-subtle bg-background/40 px-4 py-8 text-center">
        <p className="text-[13px] font-medium text-foreground">Not enough activity yet</p>
        <p className="mt-1 text-[12px] leading-relaxed text-secondary">
          No calls were recorded in this period, so there is no trend to draw. Log calls from a lead
          or run a Callbook to build the baseline.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 text-[11.5px] text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-accent/70" aria-hidden="true" /> Calls
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-success/70" aria-hidden="true" /> Conversations
        </span>
        <span className="ml-auto text-muted">
          {totalCalls} calls · {totalConversations} conversations
        </span>
      </div>

      <div
        className="mt-3 flex h-28 items-end gap-[3px]"
        role="img"
        aria-label={`Calls per day: ${totalCalls} total across ${points.length} days, ${totalConversations} conversations.`}
      >
        {points.map((point) => {
          const callHeight = peak > 0 ? Math.max((point.calls / peak) * 100, point.calls > 0 ? 3 : 0) : 0;
          const conversationHeight =
            peak > 0 ? Math.max((point.conversations / peak) * 100, point.conversations > 0 ? 3 : 0) : 0;
          return (
            <div
              key={point.date}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-[2px]"
              title={`${formatPeriodDate(point.date)}: ${point.calls} calls, ${point.conversations} conversations`}
            >
              <div className="flex w-full items-end justify-center gap-[1px]" style={{ height: "100%" }}>
                <span
                  className="w-1/2 rounded-t-sm bg-accent/70"
                  style={{ height: `${callHeight}%` }}
                  aria-hidden="true"
                />
                <span
                  className="w-1/2 rounded-t-sm bg-success/70"
                  style={{ height: `${conversationHeight}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
        <span>{formatPeriodDate(points[0]?.date ?? "")}</span>
        <span>{formatPeriodDate(points[points.length - 1]?.date ?? "")}</span>
      </div>

      <table className="sr-only">
        <caption>Call activity per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Calls</th>
            <th scope="col">Conversations</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{point.date}</th>
              <td>{point.calls}</td>
              <td>{point.conversations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}