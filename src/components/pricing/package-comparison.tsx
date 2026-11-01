import { formatMoney } from "@/lib/guides/currency";
import { findPageCountFeature } from "@/lib/guides/pricing";
import type { Package } from "@/lib/guides/types";

/**
 * Side-by-side comparison. Packages are the columns so a long inclusion list is
 * never clipped; the wrapper scrolls horizontally on narrow screens instead of
 * squeezing the text.
 */
export function PackageComparisonTable({
  packages,
  currencyCode,
  currencyLabel,
  recommendedPackageId,
}: {
  packages: Package[];
  currencyCode: string;
  currencyLabel: string;
  recommendedPackageId: string | null;
}) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <h2 className="text-[15px] font-semibold text-foreground">Package comparison</h2>
        <p className="text-[11px] text-muted md:hidden">Scroll the table sideways to see every tier.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left align-top">
          <thead>
            <tr className="border-b border-border-subtle">
              <th scope="col" className="w-[130px] px-4 py-3 text-[11px] uppercase tracking-wider text-muted">
                Detail
              </th>
              {packages.map((product) => (
                <th key={product.id} scope="col" className="px-4 py-3 align-bottom">
                  <span className="block text-[14px] font-semibold text-foreground">{product.name}</span>
                  {product.id === recommendedPackageId ? (
                    <span className="mt-1 block text-[11px] text-accent-soft">Recommended</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-subtle">
              <th scope="row" className="px-4 py-3 text-[12px] font-medium text-muted">
                Price
              </th>
              {packages.map((product) => (
                <td key={product.id} className="px-4 py-3 text-[15px] font-semibold text-foreground">
                  {formatMoney(product.priceAmount, { currencyCode, currencyLabel }, {
                    isStartingPrice: product.isStartingPrice,
                  })}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-subtle">
              <th scope="row" className="px-4 py-3 text-[12px] font-medium text-muted">
                Timeline
              </th>
              {packages.map((product) => (
                <td key={product.id} className="px-4 py-3 text-[13px] text-secondary">
                  {product.timeline}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-subtle">
              <th scope="row" className="px-4 py-3 text-[12px] font-medium text-muted">
                Included pages
              </th>
              {packages.map((product) => {
                const pageFeature = findPageCountFeature(
                  product.features.map((feature) => feature.featureText),
                );
                return (
                  <td
                    key={product.id}
                    className={pageFeature ? "px-4 py-3 text-[13px] text-secondary" : "px-4 py-3 text-[13px] text-muted"}
                  >
                    {pageFeature ?? "Not stated in the guide"}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th scope="row" className="px-4 py-3 align-top text-[12px] font-medium text-muted">
                Inclusions
              </th>
              {packages.map((product) => (
                <td key={product.id} className="px-4 py-3 align-top">
                  <ul className="space-y-1">
                    {product.features.map((feature) => (
                      <li key={feature.id} className="text-[13px] leading-relaxed text-secondary">
                        {feature.featureText}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="border-t border-border-subtle px-4 py-2.5 text-[11px] leading-relaxed text-muted">
        The source guide does not define exclusions per tier, so a missing inclusion is reported as not
        stated rather than as a confirmed exclusion.
      </p>
    </div>
  );
}