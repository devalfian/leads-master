import { formatMinorUnits } from "@/lib/quotes/money";
import type { Quote, QuoteTerms } from "@/lib/quotes/types";
import { formatDateOnly, formatTimestampDate } from "@/lib/guides/format";

const TERM_LABELS: Array<{ key: keyof QuoteTerms; label: string }> = [
  { key: "timeline", label: "Estimated timeline" },
  { key: "revisions", label: "Revisions" },
  { key: "paymentTerms", label: "Payment terms" },
  { key: "hosting", label: "Hosting" },
  { key: "domain", label: "Domain" },
  { key: "maintenance", label: "Maintenance" },
  { key: "exclusions", label: "Scope exclusions" },
  { key: "clientResponsibilities", label: "Client responsibilities" },
  { key: "additionalWork", label: "Additional work" },
  { key: "notes", label: "Notes" },
];

/**
 * The quotation document itself. Everything printed here comes from the quote's
 * own saved snapshot — client details, line items, prices and terms — so printing
 * an old quotation reproduces the amounts the client was given.
 */
export function QuoteDocument({ quote }: { quote: Quote }) {
  const currency = { currencyCode: quote.currencyCode, currencyLabel: quote.currencyLabel };
  const terms = TERM_LABELS.filter((entry) => {
    const value = quote.terms[entry.key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return (
    <article className="mx-auto w-full max-w-3xl rounded-card border border-border-subtle bg-white p-6 text-neutral-900 shadow-sm sm:p-8 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
            [Your Company]
          </p>
          <p className="text-[12px] text-neutral-500">Website development quotation</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px] sm:text-right">
          <dt className="text-neutral-500">Quote number</dt>
          <dd className="font-medium text-neutral-900">{quote.quoteNumber}</dd>
          <dt className="text-neutral-500">Issued</dt>
          <dd className="text-neutral-900">{formatTimestampDate(quote.createdAt)}</dd>
          <dt className="text-neutral-500">Valid until</dt>
          <dd className="text-neutral-900">
            {quote.validUntil ? formatDateOnly(quote.validUntil) : "Not stated"}
          </dd>
        </dl>
      </header>

      <section className="grid gap-5 border-b border-neutral-200 py-5 sm:grid-cols-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Prepared for
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-neutral-900">
            {quote.client.businessName || quote.leadBusinessName}
          </p>
          <div className="mt-1 space-y-0.5 text-[12.5px] text-neutral-600">
            {quote.client.contactName ? <p>{quote.client.contactName}</p> : null}
            {quote.client.address ? <p>{quote.client.address}</p> : null}
            {quote.client.city ? <p>{quote.client.city}</p> : null}
            {quote.client.email ? <p>{quote.client.email}</p> : null}
            {quote.client.phone ? <p>{quote.client.phone}</p> : null}
          </div>
        </div>
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Project
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-neutral-900">{quote.projectTitle}</p>
          {quote.projectDescription.trim() ? (
            <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-neutral-600">
              {quote.projectDescription}
            </p>
          ) : null}
          <p className="mt-1 text-[11.5px] text-neutral-500">
            {[quote.client.marketName ?? quote.marketName, quote.nicheLabel]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </section>
<section className="py-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          Scope of work
        </h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-neutral-500">
                <th className="py-1.5 pr-2 font-medium">Description</th>
                <th className="px-2 py-1.5 text-right font-medium">Qty</th>
                <th className="px-2 py-1.5 text-right font-medium">Unit price</th>
                <th className="py-1.5 pl-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((line) => (
                <tr key={line.id} className="border-b border-neutral-100 align-top">
                  <td className="py-2 pr-2 text-neutral-900">{line.description}</td>
                  <td className="px-2 py-2 text-right text-neutral-600">{line.quantity}</td>
                  <td className="px-2 py-2 text-right text-neutral-600">
                    {formatMinorUnits(line.unitPriceMinor, currency)}
                  </td>
                  <td className="py-2 pl-2 text-right font-medium text-neutral-900">
                    {formatMinorUnits(line.lineTotalMinor, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quote.packageSnapshot && quote.packageSnapshot.features.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Included in {quote.packageSnapshot.name}
            </h3>
            <ul className="mt-1.5 grid gap-1 text-[12.5px] text-neutral-700 sm:grid-cols-2">
              {quote.packageSnapshot.features.map((feature) => (
                <li key={feature} className="flex gap-1.5">
                  <span aria-hidden="true" className="text-neutral-400">
                    •
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="flex justify-end border-t border-neutral-200 pt-4">
        <dl className="w-full max-w-[280px] space-y-1 text-[12.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd className="text-neutral-900">{formatMinorUnits(quote.subtotalMinor, currency)}</dd>
          </div>
          {quote.discountAmountMinor > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">
                Discount
                {quote.discountType === "percent" ? ` (${quote.discountPercentBp / 100}%)` : ""}
              </dt>
              <dd className="text-neutral-900">
                − {formatMinorUnits(quote.discountAmountMinor, currency)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-3 border-t border-neutral-300 pt-1.5">
            <dt className="text-[13px] font-semibold text-neutral-900">Total</dt>
            <dd className="text-[17px] font-semibold text-neutral-900">
              {formatMinorUnits(quote.totalMinor, currency)}
            </dd>
          </div>
        </dl>
      </section>

      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
        Amounts are in {quote.currencyCode}. No tax is calculated on this quotation and no currency
        conversion has been applied.
      </p>

      {terms.length > 0 ? (
        <section className="mt-5 border-t border-neutral-200 pt-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Terms
          </h2>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {terms.map((entry) => (
              <div key={entry.key}>
                <dt className="text-[11.5px] font-medium text-neutral-700">{entry.label}</dt>
                <dd className="whitespace-pre-wrap text-[12px] leading-relaxed text-neutral-600">
                  {quote.terms[entry.key]}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <footer className="mt-6 border-t border-neutral-200 pt-3 text-[11px] leading-relaxed text-neutral-500">
        This quotation is a price reference for the scope described above. It is not an invoice and
        no payment has been recorded against it.
      </footer>
    </article>
  );
}