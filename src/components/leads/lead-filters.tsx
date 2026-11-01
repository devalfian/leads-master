import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/types";
import type { CallbookMarketOption } from "@/lib/callbooks/types";

export type LeadFilterValues = {
  q: string;
  market: string;
  niche: string;
  status: string;
  follow: string;
  website: string;
  contact: string;
  sort: string;
  archived: boolean;
};

/**
 * Server-rendered filter form: it submits as a normal GET request, so filtering
 * always happens in SQL on the whole lead table rather than in the browser.
 */
export function LeadFilters({
  markets,
  values,
}: {
  markets: CallbookMarketOption[];
  values: LeadFilterValues;
}) {
  return (
    <form action="/leads" method="get" className="rounded-card border border-border-subtle bg-surface p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5 xl:col-span-2">
          <Label htmlFor="filter-q">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              id="filter-q"
              name="q"
              defaultValue={values.q}
              placeholder="Business, contact, phone, email, website, city…"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-market">Market</Label>
          <Select id="filter-market" name="market" defaultValue={values.market}>
            <option value="">All markets</option>
            {markets.map((market) => (
              <option key={market.id} value={market.code}>
                {market.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-niche">Niche</Label>
          <Select id="filter-niche" name="niche" defaultValue={values.niche}>
            <option value="">All niches</option>
            {markets.flatMap((market) =>
              market.niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {market.name} · {niche.name}
                </option>
              )),
            )}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Lead status</Label>
          <Select id="filter-status" name="status" defaultValue={values.status}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-follow">Follow-up</Label>
          <Select id="filter-follow" name="follow" defaultValue={values.follow}>
            <option value="">Any follow-up state</option>
            <option value="scheduled">Scheduled</option>
            <option value="due">Due today or earlier</option>
            <option value="overdue">Overdue</option>
            <option value="none">Not scheduled</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-website">Website info</Label>
          <Select id="filter-website" name="website" defaultValue={values.website}>
            <option value="">Any website state</option>
            <option value="known">Website recorded</option>
            <option value="unknown">No website recorded</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-contact">Contact state</Label>
          <Select id="filter-contact" name="contact" defaultValue={values.contact}>
            <option value="">Any contact state</option>
            <option value="never">Never contacted</option>
            <option value="contacted">Contacted</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-sort">Sort</Label>
          <Select id="filter-sort" name="sort" defaultValue={values.sort}>
            <option value="updated">Recently updated</option>
            <option value="name">Business name</option>
            <option value="next_follow_up">Next follow-up</option>
            <option value="last_contact">Recently contacted</option>
            <option value="oldest_uncontacted">Oldest uncontacted</option>
            <option value="value">Estimated value</option>
          </Select>
        </div>

        <label className="flex items-end gap-2 pb-2 text-[12px] text-secondary">
          <input type="checkbox" name="archived" value="1" defaultChecked={values.archived} />
          Include archived leads
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm">
          Apply filters
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/leads">Clear</Link>
        </Button>
      </div>
    </form>
  );
}