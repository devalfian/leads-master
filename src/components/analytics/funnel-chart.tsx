import type { FunnelStage } from "@/lib/analytics/types";

/**
 * Cohort funnel. Bar widths are relative to the first stage, so the shape of the
 * drop-off is visible; the numbers are always shown as text as well, because a
 * bar alone cannot be read precisely.
 *
 * A conversion is only printed when the previous stage actually has records;
 * otherwise the column says "N/A" instead of inventing a 0%.
 */
export function FunnelChart({ stages, cohortSize }: { stages: FunnelStage[]; cohortSize: number }) {
  const top = stages[0]?.count ?? 0;

  if (top === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-border-subtle bg-background/40 px-4 py-8 text-center">
        <p className="text-[13px] font-medium text-foreground">No cohort to measure yet</p>
        <p className="mt-1 text-[12px] leading-relaxed text-secondary">
          No leads were created in this period, so there is no population for the funnel. Widen the
          date range or add leads.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11.5px] leading-relaxed text-muted">
        Cohort: the {cohortSize} lead{cohortSize === 1 ? "" : "s"} created in this period. Each stage
        counts how many of those leads have the evidence recorded.
      </p>

      <ol className="mt-3 space-y-2.5">
        {stages.map((stage) => {
          const width = top > 0 ? Math.max((stage.count / top) * 100, stage.count > 0 ? 4 : 0) : 0;
          return (
            <li key={stage.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[12.5px] text-secondary">{stage.label}</span>
                <span className="text-[12.5px] font-medium text-foreground">
                  {stage.count}
                  {stage.conversion !== null ? (
                    <span className="ml-2 text-[11.5px] font-normal text-muted">
                      {stage.conversion.toFixed(0)}% of previous
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full bg-accent/70"
                  style={{ width: `${width}%` }}
                  aria-hidden="true"
                />
              </div>
              {stage.note ? (
                <p className="mt-1 text-[11px] text-muted">{stage.note}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}