import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { PERIOD_PRESETS, PERIOD_PRESET_LABELS } from "@/lib/analytics/period";

export type AnalyticsFilterValues = {
  preset: string;
  from: string;
  to: string;
  market: string;
  niche: string;
};

/**
 * Global filters.
 *
 * A plain GET form: the browser reloads `/analytics` with query parameters, the
 * server recomputes every figure, and there is no client-side state that could
 * leave one card filtered and another not. Nothing is remembered between visits
 * except by the URL, which is what a bookmark needs to reproduce a view.
 */
export function AnalyticsFilters({
  values,
  markets,
  niches,
}: {
  values: AnalyticsFilterValues;
  markets: Array<{ code: string; name: string }>;
  niches: Array<{ id: string; name: string; marketCode: string }>;
}) {
  const filtered = Boolean(values.market || values.niche) || values.preset !== "30d";

  return (
    <form
      action="/analytics"
      method="get"
      className="rounded-card border border-border-subtle bg-surface p-4"
    >
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted">
        <Search className="size-3.5" aria-hidden="true" />
        Reporting filters
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="filter-preset">Period</Label>
          <Select id="filter-preset" name="preset" defaultValue={values.preset}>
            {PERIOD_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {PERIOD_PRESET_LABELS[preset]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-from">From (custom range)</Label>
          <Input id="filter-from" type="date" name="from" defaultValue={values.from} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-to">To (custom range)</Label>
          <Input id="filter-to" type="date" name="to" defaultValue={values.to} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-market">Market</Label>
          <Select id="filter-market" name="market" defaultValue={values.market}>
            <option value="">All markets</option>
            {markets.map((market) => (
              <option key={market.code} value={market.code}>
                {market.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-niche">Niche</Label>
          <Select id="filter-niche" name="niche" defaultValue={values.niche}>
            <option value="">All niches</option>
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.name} ({niche.marketCode})
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        The custom range is used only when the period is set to “Custom range”. Periods are WIB
        calendar days and exclude the end boundary, so no call is counted twice.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="secondary">
          Apply filters
        </Button>
        {filtered ? (
          <Button asChild size="sm" variant="ghost">
            <Link href="/analytics">Reset</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}