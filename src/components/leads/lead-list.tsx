import Link from "next/link";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FollowUpLabel, LeadStatusBadge } from "@/components/leads/lead-badges";
import type { LeadWithActivity } from "@/lib/leads/types";
import { formatDateTime, pluralise } from "@/lib/utils";

type Result = { leads: LeadWithActivity[]; total: number; page: number; pageSize: number };

function BusinessCell({ lead }: { lead: LeadWithActivity }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/leads/${lead.id}`}
          className="truncate text-[13px] font-medium text-foreground hover:text-accent-soft"
        >
          {lead.businessName}
        </Link>
        {lead.doNotContact ? <Badge tone="danger">Do not contact</Badge> : null}
        {lead.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
      </div>
      <p className="mt-0.5 truncate text-[11.5px] text-muted">
        {[lead.contactName, lead.phone, lead.email, lead.city]
          .filter((value): value is string => Boolean(value))
          .join(" · ") || "No contact details recorded"}
      </p>
    </div>
  );
}

export function LeadTable({ result }: { result: Result }) {
  return (
    <div className="hidden overflow-hidden rounded-card border border-border-subtle bg-surface md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-muted">
            <th scope="col" className="px-5 py-3 font-medium">Business</th>
            <th scope="col" className="px-3 py-3 font-medium">Market / niche</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-3 py-3 font-medium">Last contact</th>
            <th scope="col" className="px-3 py-3 font-medium">Next follow-up</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {result.leads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-border-subtle/70 last:border-b-0 hover:bg-surface-elevated/40"
            >
              <td className="max-w-[280px] px-5 py-3">
                <BusinessCell lead={lead} />
              </td>
              <td className="px-3 py-3 text-[12.5px] text-secondary">
                <p>{lead.marketName}</p>
                <p className="text-[11.5px] text-muted">{lead.nicheName ?? "No niche"}</p>
              </td>
              <td className="px-3 py-3">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="px-3 py-3 text-[12px] text-secondary">
                {lead.lastContactAt ? (
                  <span>{formatDateTime(lead.lastContactAt)}</span>
                ) : (
                  <span className="text-muted">Never</span>
                )}
                <p className="text-[11px] text-muted">{pluralise(lead.callCount, "call")}</p>
              </td>
              <td className="px-3 py-3 text-[12px]">
                <FollowUpLabel dueAt={lead.nextFollowUpAt} />
              </td>
              <td className="px-5 py-3 text-right">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/leads/${lead.id}`}>
                    <Phone aria-hidden="true" />
                    Open
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LeadCards({ result }: { result: Result }) {
  return (
    <ul className="grid gap-3 md:hidden">
      {result.leads.map((lead) => (
        <li key={lead.id} className="rounded-card border border-border-subtle bg-surface p-4">
          <BusinessCell lead={lead} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <span className="text-[11.5px] text-muted">
              {lead.marketName} · {lead.nicheName ?? "No niche"}
            </span>
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-[11.5px]">
            <div>
              <dt className="text-muted">Last contact</dt>
              <dd className="text-secondary">
                {lead.lastContactAt ? formatDateTime(lead.lastContactAt) : "Never"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Next follow-up</dt>
              <dd>
                <FollowUpLabel dueAt={lead.nextFollowUpAt} />
              </dd>
            </div>
          </dl>
          <div className="mt-3">
            <Button asChild size="sm" variant="secondary" className="w-full">
              <Link href={`/leads/${lead.id}`}>Open lead</Link>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LeadPagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-2 text-[12px]" aria-label="Pagination">
      {page > 1 ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={hrefFor(page - 1)}>Previous</Link>
        </Button>
      ) : (
        <span />
      )}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={hrefFor(page + 1)}>Next</Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}