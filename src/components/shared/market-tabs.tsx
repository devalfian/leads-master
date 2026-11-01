import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Market } from "@/lib/guides/types";

/**
 * Market selector. Rendered as real links so the selected market survives a
 * refresh, a bookmark and the back button.
 */
export function MarketTabs({
  markets,
  activeCode,
  hrefFor,
  className,
}: {
  markets: Market[];
  activeCode?: string;
  hrefFor: (code: string) => string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Market"
      className={cn(
        "flex flex-wrap gap-1 rounded-[12px] border border-border-subtle bg-surface p-1",
        className,
      )}
    >
      {markets.map((market) => {
        const active = market.code === activeCode;
        return (
          <Link
            key={market.code}
            href={hrefFor(market.code)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-[9px] px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
              active
                ? "bg-accent/15 text-foreground"
                : "text-secondary hover:bg-surface-elevated hover:text-foreground",
            )}
          >
            <span>{market.name}</span>
            <span className={cn("text-[11px]", active ? "text-accent-soft" : "text-muted")}>
              {market.currencyCode}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}