import Link from "next/link";
import { CalendarCheck, MapPin, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScheduleWarning } from "@/components/shared/schedule-warning";
import { GuideReferencePanel } from "@/components/session-planner/guide-reference-panel";
import { formatMoney } from "@/lib/guides/currency";
import { formatTimestampDate, formatWibRange } from "@/lib/guides/format";
import type { SessionDetail } from "@/lib/guides/types";

/**
 * The saved session preparation page. Everything here is read from the stored
 * snapshot, not from current master data, so reopening an old session shows the
 * plan that was actually saved.
 */
export function SessionDetailSections({ session }: { session: SessionDetail }) {
  const snapshot = session.snapshot;
  const money = { currencyCode: session.currencyCode, currencyLabel: session.currencyLabel };
  const recommended = snapshot.recommendedPackage;
  const schedule = snapshot.schedule;

  const priceNote =
    snapshot.priceSource === "niche"
      ? `Source-guide niche price for ${snapshot.nichePriceGroups
          .map((group) => group.label)
          .join(", ")}${
          recommended && recommended.standardPriceAmount !== recommended.priceAmount
            ? ` (standard package price ${formatMoney(recommended.standardPriceAmount, money)})`
            : ""
        }.`
      : snapshot.priceSource === "standard"
        ? "No niche-specific price was supplied for this niche — the standard package price is shown as a reference."
        : "This market has no recommended package configured, so no price is shown.";

  return (
    <div className="space-y-4">
      {snapshot.market.scheduleNoteReviewRequired ? (
        <ScheduleWarning timezoneNote={snapshot.market.timezoneNote} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-card border border-border-subtle bg-surface p-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
              <Target className="size-4 text-accent-soft" aria-hidden="true" />
              Targeting summary
            </h2>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted">
                  Calling time (WIB)
                </dt>
                <dd className="mt-0.5 text-[13px] text-foreground">
                  {schedule
                    ? formatWibRange(
                        schedule.startTimeWib,
                        schedule.endTimeWib,
                        schedule.timezoneLabel,
                      )
                    : "No schedule recorded"}
                </dd>
                {schedule?.localTimeLabel ? (
                  <dd className="text-[12px] text-muted">
                    Source local time: {schedule.localTimeLabel}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-muted">Selected niche</dt>
                <dd className="mt-0.5 text-[13px] text-foreground">
                  {snapshot.niche.name ?? "Not specified (general session)"}
                </dd>
                {snapshot.niche.services.length > 0 ? (
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {snapshot.niche.services.map((service) => (
                      <span
                        key={service}
                        className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[11.5px] text-secondary"
                      >
                        {service}
                      </span>
                    ))}
                  </dd>
                ) : null}
              </div>
            </dl>

            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
                <MapPin className="size-3" aria-hidden="true" />
                Target cities / areas
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {(schedule?.cityLabels ?? []).map((city) => (
                  <li
                    key={city}
                    className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[11.5px] text-secondary"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3">
              <p className="text-[11px] uppercase tracking-wider text-muted">
                Schedule priority niches
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {(schedule?.priorityLabels ?? []).map((priority) => (
                  <li
                    key={priority}
                    className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11.5px] text-accent-soft"
                  >
                    {priority}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted">Objective</p>
              <p className="mt-0.5 text-[13px] text-foreground">{snapshot.objective}</p>
            </div>

            {schedule?.scheduleNote ? (
              <p className="mt-3 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2 text-[12px] text-secondary">
                <span className="font-medium text-foreground">Schedule note: </span>
                {schedule.scheduleNote}
              </p>
            ) : null}
          </section>

          {snapshot.notes.trim() ? (
            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <h2 className="text-[15px] font-semibold text-foreground">Preparation notes</h2>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-secondary">
                {snapshot.notes}
              </p>
            </section>
          ) : null}
        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-foreground">Pricing snapshot</h2>
            <Badge tone={snapshot.priceSource === "niche" ? "warning" : "neutral"}>
              {snapshot.priceSource === "niche"
                ? "niche price"
                : snapshot.priceSource === "standard"
                  ? "standard price"
                  : "no price configured"}
            </Badge>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-secondary">{priceNote}</p>

          <Link
            href={`/dashboard/pricing/${session.marketCode}`}
            className="mt-2 inline-block text-[11px] text-accent-soft underline-offset-4 hover:underline print:hidden"
          >
            Open {snapshot.market.name} in the pricing library
          </Link>
          {recommended ? (
            <div className="mt-3 rounded-[10px] border border-accent/40 bg-accent/10 p-3">
              <p className="text-[13px] font-semibold text-foreground">{recommended.name}</p>
              <p className="text-[24px] font-bold text-foreground">
                {formatMoney(recommended.priceAmount, money, {
                  isStartingPrice: recommended.isStartingPrice,
                })}
              </p>
              <p className="text-[12px] text-secondary">{recommended.timeline}</p>
              <ul className="mt-2 space-y-1">
                {recommended.features.map((feature) => (
                  <li key={feature} className="text-[12.5px] leading-relaxed text-secondary">
                    · {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2 text-[12px] text-secondary">
              No recommended package is configured for this market.
            </p>
          )}

          <h3 className="mt-4 text-[11px] uppercase tracking-wider text-muted">Other tiers</h3>
          <ul className="mt-1 space-y-1">
            {snapshot.packages.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-secondary">
                  {product.name}
                  {product.isRecommended ? (
                    <Badge tone="accent" className="ml-2">
                      recommended
                    </Badge>
                  ) : null}
                </span>
                <span className="font-medium text-foreground">
                  {formatMoney(product.priceAmount, money, {
                    isStartingPrice: product.isStartingPrice,
                  })}
                </span>
              </li>
            ))}
          </ul>
          {snapshot.nichePriceGroups.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-[11px] uppercase tracking-wider text-muted">
                Niche-specific prices
              </h3>
              {snapshot.nichePriceGroups.map((group) => (
                <div
                  key={group.label}
                  className="mt-1.5 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2"
                >
                  <p className="text-[12px] font-medium text-foreground">{group.label}</p>
                  <ul className="mt-1 space-y-0.5">
                    {group.prices.map((price) => (
                      <li
                        key={price.packageId}
                        className="flex items-center justify-between gap-2 text-[12.5px]"
                      >
                        <span className="text-secondary">{price.packageName}</span>
                        <span className="font-medium text-foreground">
                          {formatMoney(price.priceAmount, money)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2 text-[12px] leading-relaxed text-secondary">
              The guide data does not supply a niche-specific price for this session&apos;s niche.
            </p>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarCheck className="size-3" aria-hidden="true" />
            Snapshot captured {formatTimestampDate(snapshot.capturedAt)}
          </p>
        </section>
      </div>

      <GuideReferencePanel
        callObjectives={snapshot.callObjectives}
        sessionGoals={snapshot.sessionGoals}
        checklist={snapshot.checklist}
        objections={snapshot.objections}
        tools={snapshot.tools}
      />
    </div>
  );
}