import { cn } from "@/lib/utils";

/**
 * A single KPI.
 *
 * `comparison` is optional and only supplied where the previous period uses an
 * identical definition. When it is `null` the card shows no delta at all — there
 * is no such thing as a "+0%" or a "+12%" that was not measured.
 */
export function KpiCard({
  label,
  value,
  definition,
  comparison = null,
  unavailableReason = null,
  tone = "default",
}: {
  label: string;
  value: string;
  definition: string;
  comparison?: { current: number; previous: number } | null;
  unavailableReason?: string | null;
  tone?: "default" | "warning" | "danger";
}) {
  const delta =
    comparison && comparison.previous > 0
      ? { diff: comparison.current - comparison.previous, base: comparison.previous }
      : null;

  const percent = delta ? Math.round((delta.diff / delta.base) * 100) : null;
  const arrow = !delta || delta.diff === 0 ? "→" : delta.diff > 0 ? "↑" : "↓";

  return (
    <div
      className={cn(
        "rounded-card border bg-surface p-4",
        tone === "danger"
          ? "border-danger/40"
          : tone === "warning"
            ? "border-warning/40"
            : "border-border-subtle",
      )}
      title={definition}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none text-foreground">{value}</p>

      {unavailableReason ? (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{unavailableReason}</p>
      ) : percent !== null && delta ? (
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-secondary">
          <span
            aria-hidden="true"
            className={cn(
              delta.diff > 0 ? "text-success" : delta.diff < 0 ? "text-warning" : "text-muted",
            )}
          >
            {arrow}
          </span>
          <span>
            {delta.diff > 0 ? "+" : ""}
            {delta.diff} vs previous period ({percent > 0 ? "+" : ""}
            {percent}%)
          </span>
        </p>
      ) : (
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          No comparable activity in the previous period.
        </p>
      )}
    </div>
  );
}