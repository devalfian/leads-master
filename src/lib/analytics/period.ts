/**
 * Reporting periods for analytics.
 *
 * Timestamps are stored as UTC ISO strings everywhere in this application. A
 * reporting period, however, is a human concept: "today", "this month". This
 * module is the single place where the two meet.
 *
 * The reporting timezone is **WIB (Asia/Jakarta, UTC+07:00)** — the operator's
 * own timezone, and the timezone the calling schedule is written in. WIB has no
 * daylight saving, so the offset is a constant and every boundary below is exact
 * integer arithmetic; nothing here depends on the browser clock, the server
 * clock, or `Intl` data.
 *
 * Periods are half-open: `startIso <= event < endIso`. Two adjacent periods can
 * therefore never both contain the same record.
 */

export const REPORTING_TIMEZONE = {
  id: "Asia/Jakarta",
  label: "WIB",
  offsetMinutes: 7 * 60,
} as const;

const OFFSET_MS = REPORTING_TIMEZONE.offsetMinutes * 60_000;

export const PERIOD_PRESETS = [
  "today",
  "7d",
  "30d",
  "this_month",
  "last_month",
  "custom",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  this_month: "This month",
  last_month: "Previous month",
  custom: "Custom range",
};

export function isPeriodPreset(value: unknown): value is PeriodPreset {
  return typeof value === "string" && (PERIOD_PRESETS as readonly string[]).includes(value);
}

export type AnalyticsPeriod = {
  preset: PeriodPreset;
  /** Inclusive first calendar day in WIB, `YYYY-MM-DD`. */
  fromDate: string;
  /** Inclusive last calendar day in WIB, `YYYY-MM-DD`. */
  toDate: string;
  /** Half-open start, UTC ISO. */
  startIso: string;
  /** Half-open end (exclusive), UTC ISO. */
  endIso: string;
  /** Calendar days covered, for display and for the comparison window. */
  days: number;
  label: string;
};

/** `2026-10-29T18:30:00.000Z` -> `2026-10-30` (the WIB calendar day). */
export function toWibDate(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso.slice(0, 10);
  return new Date(time + OFFSET_MS).toISOString().slice(0, 10);
}

/** Start of a WIB calendar day, expressed as a UTC instant. */
export function wibDayStartIso(date: string): string {
  const midnightUtc = Date.parse(`${date}T00:00:00.000Z`);
  if (Number.isNaN(midnightUtc)) return `${date}T00:00:00.000Z`;
  return new Date(midnightUtc - OFFSET_MS).toISOString();
}

/** Start of the day after `date` in WIB — the exclusive end of that day. */
export function wibDayEndIso(date: string): string {
  return wibDayStartIso(addDays(date, 1));
}

/** Adds whole days to a `YYYY-MM-DD` string without any timezone involved. */
export function addDays(date: string, days: number): string {
  const base = Date.parse(`${date}T00:00:00.000Z`);
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

export function addMonths(date: string, months: number): string {
  const [year, month] = date.split("-").map(Number);
  if (!year || !month) return date;
  const zeroBased = month - 1 + months;
  const nextYear = year + Math.floor(zeroBased / 12);
  const nextMonth = ((zeroBased % 12) + 12) % 12;
  return `${String(nextYear).padStart(4, "0")}-${String(nextMonth + 1).padStart(2, "0")}-01`;
}

export function daysBetween(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);
  return Math.round((to - from) / 86_400_000) + 1;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-10-01` -> `1 Oct 2026`. Deterministic, no locale involved. */
export function formatPeriodDate(date: string): string {
  const [year, month, day] = date.split("-");
  const name = MONTHS[Number(month) - 1];
  if (!year || !name) return date;
  return `${Number(day)} ${name} ${year}`;
}

function buildPeriod(
  preset: PeriodPreset,
  fromDate: string,
  toDate: string,
  label?: string,
): AnalyticsPeriod {
  return {
    preset,
    fromDate,
    toDate,
    startIso: wibDayStartIso(fromDate),
    endIso: wibDayEndIso(toDate),
    days: daysBetween(fromDate, toDate),
    label:
      label ??
      `${formatPeriodDate(fromDate)} – ${formatPeriodDate(toDate)} · ${REPORTING_TIMEZONE.label}`,
  };
}

/** The WIB calendar day that `now` falls on. */
export function todayInReportingZone(now: Date = new Date()): string {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export type ResolvePeriodInput = {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00.000Z`);
  if (Number.isNaN(time)) return false;
  return new Date(time).toISOString().slice(0, 10) === value;
}

/**
 * Turns the query string into a concrete period. An unknown preset or an
 * invalid custom range falls back to the default (last 30 days) rather than
 * silently producing a nonsense window.
 */
export function resolvePeriod(input: ResolvePeriodInput = {}): AnalyticsPeriod {
  const now = input.now ?? new Date();
  const today = todayInReportingZone(now);
  const preset = isPeriodPreset(input.preset) ? input.preset : "30d";

  switch (preset) {
    case "today":
      return buildPeriod("today", today, today);
    case "7d":
      return buildPeriod("7d", addDays(today, -6), today);
    case "this_month": {
      const first = `${today.slice(0, 7)}-01`;
      return buildPeriod("this_month", first, today);
    }
    case "last_month": {
      const firstOfThis = `${today.slice(0, 7)}-01`;
      const firstOfLast = addMonths(firstOfThis, -1);
      return buildPeriod("last_month", firstOfLast, addDays(firstOfThis, -1));
    }
    case "custom": {
      const from = input.from && isValidDateOnly(input.from) ? input.from : null;
      const to = input.to && isValidDateOnly(input.to) ? input.to : null;
      if (from && to && from <= to) return buildPeriod("custom", from, to);
      return buildPeriod("30d", addDays(today, -29), today);
    }
    default:
      return buildPeriod("30d", addDays(today, -29), today);
  }
}

/**
 * The comparison window: the same number of days immediately before the period,
 * so a like-for-like delta can be shown. Only used where the definition is
 * genuinely comparable (counts of events), never for rates.
 */
export function previousPeriod(period: AnalyticsPeriod): AnalyticsPeriod {
  const to = addDays(period.fromDate, -1);
  const from = addDays(to, -(period.days - 1));
  return buildPeriod("custom", from, to, `${formatPeriodDate(from)} – ${formatPeriodDate(to)}`);
}

/** Every WIB calendar day in the period, in order. Used for the trend chart. */
export function eachDay(period: AnalyticsPeriod): string[] {
  const days: string[] = [];
  for (let index = 0; index < period.days; index += 1) {
    days.push(addDays(period.fromDate, index));
  }
  return days;
}

