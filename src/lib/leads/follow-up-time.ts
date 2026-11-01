/**
 * One definition of "is this follow-up due today, overdue, or still ahead".
 *
 * `follow_ups.due_at` is written in two shapes on purpose:
 *  - a calendar day (`YYYY-MM-DD`) from the lead follow-up form and the log-call dialog;
 *  - a full UTC timestamp from a completed Callbook run, because that form asks for a
 *    date *and* a time (`datetime-local`) and stores the instant.
 *
 * Both describe a calendar day to the operator. Comparing the raw strings — which is
 * what the analytics dashboard and the automation rules used to do — made the same
 * follow-up "due today" in `getLeadStats()` and in the lead badge, but already
 * "overdue" in Analytics and in the automation queue, because `"2026-11-02"` sorts
 * before `"2026-11-02T00:00:00.000Z"`. The same value therefore produced two
 * different reminders in the same application.
 *
 * Every consumer now compares days in the reporting timezone (WIB, the timezone the
 * calling schedule is written in) instead of instants. `toWibDate()` is correct for
 * both shapes: a date-only value keeps its day, and a stored UTC instant maps to the
 * WIB day the user actually picked.
 */

import { REPORTING_TIMEZONE, todayInReportingZone, toWibDate } from "@/lib/analytics/period";

/**
 * The same day rule expressed as a SQLite date modifier, so a query can derive the
 * day of a stored follow-up without hard-coding the offset in SQL:
 *
 *     SELECT date(due_at, ?) = ?   -- the reporting-zone day = today
 *
 * `date('2026-11-02', '+7 hours')` is `2026-11-02` (a calendar day keeps its day) and
 * `date('2026-11-01T17:30:00.000Z', '+7 hours')` is `2026-11-02` (00:30 WIB), exactly
 * like `followUpDay()`.
 */
export const FOLLOW_UP_DAY_SQL_MODIFIER = `+${REPORTING_TIMEZONE.offsetMinutes / 60} hours`;

/** The reporting-zone calendar day a stored follow-up value falls on. */
export function followUpDay(dueAt: string): string {
  return toWibDate(dueAt);
}

/** The reporting-zone calendar day `now` falls on. */
export function followUpToday(now: Date = new Date()): string {
  return todayInReportingZone(now);
}

/** A scheduled follow-up whose day has already passed. */
export function isFollowUpOverdue(dueAt: string, today: string = followUpToday()): boolean {
  return followUpDay(dueAt) < today;
}

/**
 * A scheduled follow-up due today or later.
 *
 * "Due today" still counts as a next action: the lead has something scheduled, so
 * the rules for stale leads and "interested with no next action" must stay quiet.
 */
export function isFollowUpPending(dueAt: string, today: string = followUpToday()): boolean {
  return followUpDay(dueAt) >= today;
}