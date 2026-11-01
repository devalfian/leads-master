import { Clock, MapPin, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatWibRange } from "@/lib/guides/format";
import type { MarketSchedule } from "@/lib/guides/types";

/** One calling block, always showing the stored WIB range and source labels. */
export function ScheduleBlockCard({
  schedule,
  action,
  className,
}: {
  schedule: MarketSchedule;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-card border border-border-subtle bg-surface p-4",
        !schedule.isActive && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <Clock className="size-4 text-accent-soft" aria-hidden="true" />
            {formatWibRange(schedule.startTimeWib, schedule.endTimeWib, schedule.timezoneLabel)}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            {schedule.scheduleCode}
            {schedule.localTimeLabel ? ` · ${schedule.localTimeLabel}` : ""}
            {schedule.timezoneLabel ? ` · ${schedule.timezoneLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!schedule.isActive ? <Badge tone="neutral">Inactive</Badge> : null}
          {action}
        </div>
      </div>

      <p className="mt-2.5 text-[13px] font-medium text-secondary">{schedule.title}</p>

      <div className="mt-3 space-y-2">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
            <MapPin className="size-3" aria-hidden="true" />
            Target cities
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {schedule.cityLabels.map((city) => (
              <li
                key={city}
                className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[11.5px] text-secondary"
              >
                {city}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
            <Target className="size-3" aria-hidden="true" />
            Priority focus
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {schedule.priorityLabels.map((priority) => (
              <li
                key={priority}
                className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11.5px] text-accent-soft"
              >
                {priority}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {schedule.scheduleNote ? (
        <p className="mt-3 rounded-[8px] border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-[12px] text-warning">
          {schedule.scheduleNote}
        </p>
      ) : null}
    </article>
  );
}