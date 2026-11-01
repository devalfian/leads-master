import type { OutcomeSlice } from "@/lib/analytics/types";
import { outcomeToneClasses } from "@/lib/callbooks/outcomes";
import { cn } from "@/lib/utils";

/**
 * Structured call outcomes for the period.
 *
 * Every recorded outcome is listed with its actual count; outcomes with no
 * records are omitted rather than drawn as zero-height decoration. Calls with no
 * outcome appear as "Not recorded" so the total reconciles with Calls made.
 */
export function OutcomeChart({ slices, total }: { slices: OutcomeSlice[]; total: number }) {
  if (total === 0) {
    return (
      <p className="rounded-[10px] border border-dashed border-border-subtle bg-background/40 px-4 py-6 text-center text-[12.5px] text-secondary">
        No call outcomes recorded in this period.
      </p>
    );
  }

  const peak = slices.reduce((max, slice) => Math.max(max, slice.count), 0);

  return (
    <ul className="space-y-2">
      {slices.map((slice) => {
        const width = peak > 0 ? Math.max((slice.count / peak) * 100, 2) : 0;
        const share = total > 0 ? Math.round((slice.count / total) * 100) : 0;
        return (
          <li key={slice.key}>
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  outcomeToneClasses(slice.key === "unrecorded" ? null : slice.key),
                )}
              >
                {slice.label}
              </span>
              <span className="text-[12px] text-secondary">
                {slice.count}
                <span className="ml-1.5 text-[11px] text-muted">{share}%</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full bg-accent/60"
                style={{ width: `${width}%` }}
                aria-hidden="true"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}