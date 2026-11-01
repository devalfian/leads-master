"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Phone,
  Tags,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflineStatusPill } from "@/components/offline/offline-status";

/**
 * Only destinations that the application actually implements are listed here.
 * The workspace is a single-user tool: there is no prospects module, so no
 * "Prospects" link is invented.
 */
const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        matches: ["/dashboard"],
        exact: true,
      },
      {
        href: "/leads",
        label: "Leads",
        icon: Users,
        matches: ["/leads"],
        exact: false,
      },
      {
        href: "/quotes",
        label: "Quotes",
        icon: FileText,
        matches: ["/quotes"],
        exact: false,
      },
      {
        href: "/dashboard/sessions",
        label: "Session Planner",
        icon: CalendarClock,
        matches: ["/dashboard/sessions"],
        exact: false,
      },
      {
        href: "/dashboard/pricing",
        label: "Pricing Library",
        icon: Tags,
        matches: ["/dashboard/pricing"],
        exact: false,
      },
      {
        href: "/dashboard/settings/guide-data",
        label: "Guide Data",
        icon: Database,
        matches: ["/dashboard/settings"],
        exact: false,
      },
    ],
  },
  {
    label: "Calling",
    items: [
      {
        href: "/callbooks",
        label: "Call Playbooks",
        icon: BookOpen,
        matches: ["/callbooks"],
        exact: false,
      },
      { href: "/calls", label: "Call History", icon: History, matches: ["/calls"], exact: false },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/analytics",
        label: "Analytics",
        icon: LayoutDashboard,
        matches: ["/analytics"],
        exact: false,
      },
      {
        href: "/automation",
        label: "Automation",
        icon: CalendarClock,
        matches: ["/automation"],
        exact: false,
      },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-border-subtle bg-sidebar lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5 lg:py-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-accent/15 text-accent-soft">
            <Phone className="size-4" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold tracking-wide text-foreground">
              Call Playbooks
            </span>
            <span className="block text-[11px] text-muted">Sales command center</span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Primary"
        className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex gap-1 lg:flex-col lg:gap-1">
            <p className="hidden px-3 pb-1 pt-3 text-[10.5px] font-medium uppercase tracking-wider text-muted lg:block">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = item.matches.some((prefix) =>
                item.exact
                  ? pathname === prefix
                  : pathname === prefix || pathname.startsWith(`${prefix}/`),
              );
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "bg-accent/15 text-foreground"
                      : "text-secondary hover:bg-surface-elevated hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-4", active ? "text-accent-soft" : "text-muted")}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="hidden px-5 py-6 lg:mt-auto lg:block">
        <OfflineStatusPill />
        <div className="mt-2 rounded-[10px] border border-border-subtle bg-surface/60 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Workspace</p>
          <p className="mt-1.5 text-xs leading-relaxed text-secondary">
            Single-user workspace. Pricing, sessions and call history are stored in Cloudflare D1.
            Session snapshots keep the guide data they were created with.
          </p>
        </div>
      </div>
    </aside>
  );
}