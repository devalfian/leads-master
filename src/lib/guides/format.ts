/**
 * Date/time presentation for the guide data.
 *
 * Everything is deterministic and locale-pinned so a server render and a client
 * render agree. The schedule times themselves are the stored WIB values: nothing
 * here recalculates a local time from a timezone offset.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-29" -> "29 Oct 2026" (no `Date` parsing, so no timezone drift). */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "—";
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return "—";
  return `${Number(day)} ${monthName} ${year}`;
}

/** "2026-10-29" -> "29 Oct 2026"; ISO timestamps fall back to their date part. */
export function formatTimestampDate(value: string | null | undefined): string {
  if (!value) return "—";
  return formatDateOnly(value.slice(0, 10));
}

export function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  if (monthNumber < 1 || monthNumber > 12) return false;
  if (dayNumber < 1 || dayNumber > 31) return false;
  const daysInMonth = new Date(Date.UTC(Number(year), monthNumber, 0)).getUTCDate();
  return dayNumber <= daysInMonth;
}

/** "09:00" + "09:30" + "WIB" -> "09:00–09:30 WIB". */
export function formatWibRange(startTimeWib: string, endTimeWib: string, timezoneLabel?: string | null): string {
  const label = timezoneLabel ?? "WIB";
  return `${startTimeWib}–${endTimeWib} ${label}`;
}

export function isValidTimeWib(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}