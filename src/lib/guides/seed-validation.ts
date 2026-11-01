/**
 * Seed validation.
 *
 * Produces the explicit report the spec asks for: exact record counts, the
 * market codes, the recommended prices, the US specialty rows, schedule times
 * and the integrity rules (a niche price row must use its own market's package).
 *
 * The same function backs the settings screen and the automated tests, so what
 * the operator sees is exactly what CI checks.
 */

import { getDb } from "@/lib/db";
import type { DbExecutor } from "@/lib/db";
import type { SeedValidationCheck, SeedValidationReport } from "./types";

async function scalar(
  executor: DbExecutor,
  sql: string,
  params: readonly (string | number)[] = [],
) {
  const row = await executor.first<Record<string, unknown>>(sql, [...params]);
  if (!row) return null;
  const values = Object.values(row);
  return values.length > 0 ? values[0] : null;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

async function countObjectives(executor: DbExecutor, marketCode: string): Promise<number> {
  return Number(
    await scalar(
      executor,
      `SELECT COUNT(*) FROM market_call_goals g
         JOIN markets m ON m.id = g.market_id
        WHERE m.code = ? AND g.goal_kind = 'call_objective'`,
      [marketCode],
    ),
  );
}

export async function validateGuideSeed(db?: DbExecutor): Promise<SeedValidationReport> {
  const executor = db ?? (await getDb());
  const checks: SeedValidationCheck[] = [];

  const add = (label: string, expected: string | number, actual: string | number): void => {
    checks.push({
      label,
      expected: text(expected),
      actual: text(actual),
      ok: text(expected) === text(actual),
    });
  };

  const codes = await executor.all<{ code: string }>(
    "SELECT code FROM markets ORDER BY sort_order",
  );
  add("Market codes", "ID, AU, USA", codes.map((row) => row.code).join(", "));

  const totals = {
    markets: Number(await scalar(executor, "SELECT COUNT(*) FROM markets")),
    schedules: Number(await scalar(executor, "SELECT COUNT(*) FROM market_schedules")),
    packages: Number(await scalar(executor, "SELECT COUNT(*) FROM packages")),
    packageFeatures: Number(await scalar(executor, "SELECT COUNT(*) FROM package_features")),
    nicheCategories: Number(await scalar(executor, "SELECT COUNT(*) FROM niche_categories")),
    nicheServices: Number(await scalar(executor, "SELECT COUNT(*) FROM niche_services")),
    nichePriceRows: Number(await scalar(executor, "SELECT COUNT(*) FROM niche_price_rows")),
    nichePriceLabels: Number(
      await scalar(
        executor,
        "SELECT COUNT(*) FROM (SELECT DISTINCT market_id, niche_label FROM niche_price_rows)",
      ),
    ),
    callObjectives: Number(
      await scalar(
        executor,
        "SELECT COUNT(*) FROM market_call_goals WHERE goal_kind = 'call_objective'",
      ),
    ),
    sessionGoals: Number(
      await scalar(
        executor,
        "SELECT COUNT(*) FROM market_call_goals WHERE goal_kind = 'session_goal'",
      ),
    ),
    checklistItems: Number(
      await scalar(executor, "SELECT COUNT(*) FROM market_call_checklist_items"),
    ),
    objections: Number(await scalar(executor, "SELECT COUNT(*) FROM market_objections")),
    tools: Number(await scalar(executor, "SELECT COUNT(*) FROM market_recommended_tools")),
    sessions: Number(await scalar(executor, "SELECT COUNT(*) FROM sessions")),
  };

  add("Markets", 3, totals.markets);
  add("Schedule blocks", 11, totals.schedules);
  add("Packages", 12, totals.packages);
  add("Niche categories (8 + 10 + 10)", 28, totals.nicheCategories);
  add("Niche price rows (9 + 10 + 12)", 31, totals.nichePriceLabels);
  add("Niche price records (31 rows x 3 packages)", 93, totals.nichePriceRows);
  add("Indonesia call objectives", 4, await countObjectives(executor, "ID"));
  add("USA call objectives", 4, await countObjectives(executor, "USA"));

  const recommendation = async (marketCode: string) =>
    scalar(
      executor,
      `SELECT p.name FROM markets m
         JOIN packages p ON p.id = m.recommended_package_id
        WHERE m.code = ?`,
      [marketCode],
    );
  add("Indonesia recommended package", "Growth", text(await recommendation("ID")));
  add("Australia recommended package", "Professional", text(await recommendation("AU")));
  add("United States recommended package", "Growth", text(await recommendation("USA")));

  const price = async (marketCode: string, slug: string) =>
    scalar(
      executor,
      `SELECT p.price_amount FROM packages p
         JOIN markets m ON m.id = p.market_id
        WHERE m.code = ? AND p.slug = ?`,
      [marketCode, slug],
    );
  add("Indonesia Growth price (IDR)", 3500000, text(await price("ID", "growth")));
  add("Australia Professional price (AUD)", 1200, text(await price("AU", "professional")));
  add("United States Growth price (USD)", 750, text(await price("USA", "growth")));

  const startingPackages = await executor.all<{ slug: string }>(
    `SELECT p.slug FROM packages p JOIN markets m ON m.id = p.market_id
      WHERE p.is_starting_price = 1 ORDER BY m.sort_order, p.display_order`,
  );
  add(
    "Starting-price packages",
    "company-custom, business-custom, enterprise-custom",
    startingPackages.map((row) => row.slug).join(", "),
  );

  const nichePrice = async (label: string, slug: string) =>
    scalar(
      executor,
      `SELECT nr.price_amount FROM niche_price_rows nr
         JOIN packages p ON p.id = nr.package_id
         JOIN markets m ON m.id = nr.market_id
        WHERE m.code = 'USA' AND nr.niche_label = ? AND p.slug = ?`,
      [label, slug],
    );

  const row = async (label: string) =>
    [
      await nichePrice(label, "starter"),
      await nichePrice(label, "growth"),
      await nichePrice(label, "premium"),
    ]
      .map(text)
      .join(" / ");

  add("US Law Firm row (Starter / Growth / Premium)", "750 / 1500 / 3000", await row("Law Firm"));
  add(
    "US Accounting / Consulting row",
    "750 / 1500 / 3000",
    await row("Accounting / Consulting"),
  );
  add("US Med Spa row (standard service-business prices)", "400 / 750 / 1500", await row("Med Spa"));

  const foreignPriceRows = Number(
    await scalar(
      executor,
      `SELECT COUNT(*) FROM niche_price_rows nr
         JOIN packages p ON p.id = nr.package_id
        WHERE p.market_id <> nr.market_id`,
    ),
  );
  add("Niche price rows using another market's package", 0, foreignPriceRows);

  const scheduleTimes = async (marketCode: string) =>
    (
      await executor.all<{ start_time_wib: string; end_time_wib: string }>(
        `SELECT s.start_time_wib, s.end_time_wib FROM market_schedules s
           JOIN markets m ON m.id = s.market_id
          WHERE m.code = ? ORDER BY s.sort_order`,
        [marketCode],
      )
    )
      .map((entry) => `${entry.start_time_wib}–${entry.end_time_wib}`)
      .join(", ");

  add(
    "Indonesia schedule times (WIB)",
    "09:00–09:30, 09:30–10:00, 10:00–10:30, 10:30–11:00",
    await scheduleTimes("ID"),
  );
  add(
    "Australia schedule times (WIB)",
    "06:00–07:00, 06:30–07:30, 07:00–08:00",
    await scheduleTimes("AU"),
  );
  add(
    "United States schedule times (WIB)",
    "21:00–21:30, 21:30–22:00, 22:00–22:30, 22:30–23:00",
    await scheduleTimes("USA"),
  );

  const usaNote = await executor.first<{
    timezone_note: string | null;
    schedule_note_review_required: number;
  }>("SELECT timezone_note, schedule_note_review_required FROM markets WHERE code = 'USA'");
  add("USA daylight-saving note stored", "yes", usaNote?.timezone_note ? "yes" : "no");
  add(
    "USA schedule flagged for manual verification",
    1,
    Number(usaNote?.schedule_note_review_required ?? 0),
  );

  return {
    ok: checks.every((check) => check.ok),
    checks,
    totals,
  };
}