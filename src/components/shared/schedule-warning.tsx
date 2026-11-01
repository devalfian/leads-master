import { Alert } from "@/components/ui/alert";

export const SCHEDULE_VERIFICATION_WARNING =
  "Schedule note requires timezone verification. Use the configured WIB schedule as entered in the guide until the administrator confirms an updated schedule.";

/**
 * Non-blocking warning for a market whose schedule needs manual review (the USA
 * guide's daylight-saving note). The stored note is shown verbatim; the
 * application never shifts a time on its own.
 */
export function ScheduleWarning({
  timezoneNote,
  className,
}: {
  timezoneNote: string | null;
  className?: string;
}) {
  return (
    <Alert tone="warning" title="Schedule needs verification" className={className}>
      <p>{SCHEDULE_VERIFICATION_WARNING}</p>
      {timezoneNote ? (
        <p className="mt-2 border-l-2 border-warning/40 pl-2.5 italic text-warning/90">
          Source note: “{timezoneNote}”
        </p>
      ) : null}
    </Alert>
  );
}