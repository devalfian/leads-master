"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Plus, Save, Trash2, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { apiPatch, apiPost } from "@/lib/api/client";
import { formatMoney } from "@/lib/guides/currency";
import {
  calculateQuoteTotals,
  formatMinorUnits,
  parseMajorAmount,
  toMajorUnits,
  toMinorUnits,
  type DiscountInput,
} from "@/lib/quotes/money";
import {
  EMPTY_QUOTE_TERMS,
  type QuoteDetail,
  type QuoteLeadOption,
  type QuotePackageOption,
  type QuoteTerms,
} from "@/lib/quotes/types";

type CustomLine = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type DiscountMode = "none" | "fixed" | "percent";

export type QuoteFormProps = {
  leads: QuoteLeadOption[];
  mode: "create" | "edit";
  quote?: QuoteDetail;
  defaults?: {
    leadId?: string | null;
    sourceCallId?: string | null;
    sourceSessionId?: string | null;
  };
};

const TERM_FIELDS: Array<{ key: keyof QuoteTerms; label: string; placeholder: string }> = [
  {
    key: "timeline",
    label: "Estimated timeline",
    placeholder: "Copied from the package. Edit only what you can commit to.",
  },
  { key: "revisions", label: "Revisions", placeholder: "e.g. 2 rounds of revision" },
  {
    key: "paymentTerms",
    label: "Payment terms",
    placeholder: "Only enter terms you have agreed on — nothing is defaulted.",
  },
  { key: "hosting", label: "Hosting", placeholder: "Who provides and pays for hosting" },
  { key: "domain", label: "Domain", placeholder: "Who owns and renews the domain" },
  { key: "maintenance", label: "Maintenance", placeholder: "Post-launch support arrangement" },
  { key: "exclusions", label: "Scope exclusions", placeholder: "What this quotation does not include" },
  {
    key: "clientResponsibilities",
    label: "Client responsibilities",
    placeholder: "Content, photos, approvals, access",
  },
  { key: "additionalWork", label: "Additional work", placeholder: "How out-of-scope work is handled" },
  { key: "notes", label: "Notes", placeholder: "Anything else the client should read" },
];

let lineKeySeed = 0;

function nextLineKey(): string {
  lineKeySeed += 1;
  return `line_${lineKeySeed}`;
}

function packageLabel(
  product: QuotePackageOption,
  currency: { currencyCode: string; currencyLabel: string },
): string {
  return formatMoney(product.priceAmount, currency, { isStartingPrice: product.isStartingPrice });
}
export function QuoteForm({ leads, mode, quote, defaults }: QuoteFormProps) {
  const router = useRouter();

  const initialLead =
    leads.find((lead) => lead.id === (quote?.leadId ?? defaults?.leadId ?? "")) ?? null;

  const [leadId, setLeadId] = useState<string>(initialLead?.id ?? "");
  const [primaryPackageId, setPrimaryPackageId] = useState<string>(
    quote?.packageId ?? initialLead?.packages[0]?.id ?? "",
  );
  const [projectTitle, setProjectTitle] = useState<string>(quote?.projectTitle ?? "");
  const [projectDescription, setProjectDescription] = useState<string>(
    quote?.projectDescription ?? "",
  );
  const [client, setClient] = useState({
    businessName: quote?.client.businessName ?? initialLead?.businessName ?? "",
    contactName: quote?.client.contactName ?? initialLead?.contactName ?? "",
    email: quote?.client.email ?? initialLead?.email ?? "",
    phone: quote?.client.phone ?? initialLead?.phone ?? "",
    address: quote?.client.address ?? initialLead?.address ?? "",
    city: quote?.client.city ?? initialLead?.city ?? "",
  });
  const [terms, setTerms] = useState<QuoteTerms>({
    ...EMPTY_QUOTE_TERMS,
    ...(quote?.terms ?? {}),
  });
  const [validUntil, setValidUntil] = useState<string>(quote?.validUntil ?? "");
  const [discountMode, setDiscountMode] = useState<DiscountMode>(
    quote?.discountType === "fixed" || quote?.discountType === "percent"
      ? quote.discountType
      : "none",
  );
  const [discountValue, setDiscountValue] = useState<string>(() => {
    if (!quote) return "";
    if (quote.discountType === "fixed") {
      return String(toMajorUnits(quote.discountAmountMinor, quote.currencyCode));
    }
    if (quote.discountType === "percent") return String(quote.discountPercentBp / 100);
    return "";
  });
  const [additionalLines, setAdditionalLines] = useState<CustomLine[]>(() =>
    (quote?.lineItems ?? [])
      .filter((line) => line.lineType === "custom")
      .map((line) => ({
        key: nextLineKey(),
        description: line.description,
        quantity: String(line.quantity),
        unitPrice: String(toMajorUnits(line.unitPriceMinor, quote?.currencyCode ?? "USD")),
      })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const selectedLead = leads.find((lead) => lead.id === leadId) ?? null;
  const packages = selectedLead?.packages ?? [];
  const selectedPackage = packages.find((product) => product.id === primaryPackageId) ?? null;
  const currency = {
    currencyCode: selectedLead?.currencyCode ?? quote?.currencyCode ?? "USD",
    currencyLabel: selectedLead?.currencyLabel ?? quote?.currencyLabel ?? "US$",
  };
function selectLead(nextId: string) {
    const lead = leads.find((entry) => entry.id === nextId) ?? null;
    setLeadId(nextId);
    setFieldErrors([]);
    if (!lead) {
      setPrimaryPackageId("");
      return;
    }
    setClient({
      businessName: lead.businessName,
      contactName: lead.contactName ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      address: lead.address ?? "",
      city: lead.city ?? "",
    });
    const nextPackage =
      lead.packages.find((product) => product.id === primaryPackageId) ??
      lead.packages.find((product) => product.isRecommended) ??
      lead.packages[0] ??
      null;
    setPrimaryPackageId(nextPackage?.id ?? "");
    if (!projectTitle.trim()) {
      setProjectTitle(`${lead.businessName} — ${nextPackage?.name ?? "Website"}`);
    }
  }

  function selectPackage(nextId: string) {
    setPrimaryPackageId(nextId);
    const product = packages.find((entry) => entry.id === nextId) ?? null;
    if (!product) return;
    setTerms((current) => ({ ...current, timeline: product.timeline }));
    if (!projectTitle.trim()) {
      setProjectTitle(`${selectedLead?.businessName ?? ""} — ${product.name}`.trim());
    }
  }

  function addLine() {
    setAdditionalLines((current) => [
      ...current,
      { key: nextLineKey(), description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function updateLine(key: string, patch: Partial<CustomLine>) {
    setAdditionalLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function removeLine(key: string) {
    setAdditionalLines((current) => current.filter((line) => line.key !== key));
  }

  /** The same calculation the server runs; a failure here blocks the save button. */
  const preview = useMemo(() => {
    if (!selectedPackage) {
      return { totals: null, error: "Choose a package to price this quotation." };
    }

    const lines = [
      {
        quantity: 1,
        unitPriceMinor: toMinorUnits(selectedPackage.priceAmount, currency.currencyCode),
      },
      ...additionalLines
        .filter((line) => line.description.trim().length > 0 || line.unitPrice.trim().length > 0)
        .map((line) => {
          const quantity = Number.parseInt(line.quantity, 10);
          const amount = parseMajorAmount(line.unitPrice);
          return {
            quantity: Number.isFinite(quantity) ? quantity : 0,
            unitPriceMinor: toMinorUnits(amount ?? 0, currency.currencyCode),
          };
        }),
    ];

    let discount: DiscountInput = { type: "none" };
    if (discountMode === "fixed") {
      discount = {
        type: "fixed",
        amountMinor: toMinorUnits(parseMajorAmount(discountValue) ?? 0, currency.currencyCode),
      };
    } else if (discountMode === "percent") {
      const percent = Number(discountValue);
      discount = {
        type: "percent",
        percentBp: Number.isFinite(percent) ? Math.round(percent * 100) : 0,
      };
    }

    try {
      return { totals: calculateQuoteTotals(lines, discount), error: null };
    } catch (calculationError) {
      return {
        totals: null,
        error:
          calculationError instanceof Error
            ? calculationError.message
            : "These amounts are not valid.",
      };
    }
  }, [selectedPackage, additionalLines, currency.currencyCode, discountMode, discountValue]);

async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const problems: string[] = [];
    if (!leadId) problems.push("Choose the lead this quotation is for.");
    if (!primaryPackageId) problems.push("Choose a package from the lead's market.");
    if (!projectTitle.trim()) problems.push("Give this quotation a project title.");
    if (preview.error) problems.push(preview.error);
    setFieldErrors(problems);
    if (problems.length > 0) return;

    const payload = {
      leadId,
      primaryPackageId,
      projectTitle: projectTitle.trim(),
      projectDescription,
      client: {
        businessName: client.businessName.trim() || undefined,
        contactName: client.contactName.trim() || null,
        email: client.email.trim() || null,
        phone: client.phone.trim() || null,
        address: client.address.trim() || null,
        city: client.city.trim() || null,
      },
      terms,
      discount:
        discountMode === "none"
          ? { type: "none" as const }
          : discountMode === "fixed"
            ? { type: "fixed" as const, amountMajor: parseMajorAmount(discountValue) ?? 0 }
            : {
                type: "percent" as const,
                percentBp: Math.round((Number(discountValue) || 0) * 100),
              },
      validUntil: validUntil || null,
      sourceCallId: defaults?.sourceCallId ?? null,
      sourceSessionId: defaults?.sourceSessionId ?? null,
      additionalLines: additionalLines
        .filter((line) => line.description.trim().length > 0)
        .map((line) => ({
          lineType: "custom" as const,
          description: line.description.trim(),
          quantity: Math.max(1, Number.parseInt(line.quantity, 10) || 1),
          unitPriceMajor: parseMajorAmount(line.unitPrice) ?? 0,
        })),
    };

    setSaving(true);
    setError(null);

    const result =
      mode === "edit" && quote
        ? await apiPatch<{ quote: QuoteDetail }>(`/api/quotes/${quote.id}`, payload)
        : await apiPost<{ quote: QuoteDetail }>("/api/quotes", payload);

    if (!result.ok) {
      setSaving(false);
      setError(result.error.message);
      setFieldErrors(result.error.details ?? []);
      return;
    }

    // Stay in the saving state until the detail page has been resolved.
    router.push(`/quotes/${result.data.quote.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 px-5 py-6 md:px-8 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-4">
        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <h2 className="text-[15px] font-semibold text-foreground">1. Client</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-secondary">
            A quotation belongs to an existing lead. The details below are copied onto the
            quotation, so later edits to the lead never rewrite a document you already sent.
          </p>

          {leads.length === 0 ? (
            <p className="mt-3 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2 text-[12.5px] text-secondary">
              You have no leads yet.{" "}
              <Link href="/leads/new" className="text-accent-soft underline-offset-2 hover:underline">
                Add a lead
              </Link>{" "}
              before creating a quotation.
            </p>
          ) : (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="quote-lead">Lead</Label>
              <Select
                id="quote-lead"
                value={leadId}
                onChange={(event) => selectLead(event.target.value)}
                disabled={mode === "edit"}
              >
                <option value="">Select a lead…</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.businessName} — {lead.marketCode}
                    {lead.city ? ` · ${lead.city}` : ""}
                    {lead.nicheName ? ` · ${lead.nicheName}` : ""}
                  </option>
                ))}
              </Select>
              {mode === "edit" ? (
                <p className="text-[11.5px] text-muted">
                  The client on an existing quotation cannot be swapped. Duplicate the quotation to
                  quote a different business.
                </p>
              ) : null}
            </div>
          )}

          {selectedLead ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="client-business">Business name</Label>
                <Input
                  id="client-business"
                  value={client.businessName}
                  onChange={(event) => setClient({ ...client, businessName: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-contact">Contact name</Label>
                <Input
                  id="client-contact"
                  value={client.contactName}
                  onChange={(event) => setClient({ ...client, contactName: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={client.email}
                  onChange={(event) => setClient({ ...client, email: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  value={client.phone}
                  onChange={(event) => setClient({ ...client, phone: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-city">City</Label>
                <Input
                  id="client-city"
                  value={client.city}
                  onChange={(event) => setClient({ ...client, city: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-address">Address</Label>
                <Input
                  id="client-address"
                  value={client.address}
                  onChange={(event) => setClient({ ...client, address: event.target.value })}
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <h2 className="text-[15px] font-semibold text-foreground">2. Package and scope</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-secondary">
            {selectedLead
              ? `Packages for ${selectedLead.marketName} (${selectedLead.currencyCode}), read from the Pricing Library.`
              : "Select a lead to see the packages available in its market."}
          </p>

          {selectedLead && packages.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-warning">
              No active package is configured for this market. Add one in the Pricing Library first.
            </p>
          ) : null}

          {packages.length > 0 ? (
            <fieldset className="mt-3 grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">Package</legend>
              {packages.map((product) => {
                const checked = product.id === primaryPackageId;
                return (
                  <label
                    key={product.id}
                    className={[
                      "cursor-pointer rounded-[10px] border px-3 py-2.5 transition-colors duration-150",
                      checked
                        ? "border-accent/60 bg-accent/10"
                        : "border-border-subtle bg-background/40 hover:border-accent-soft/40",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="primary-package"
                      className="sr-only"
                      value={product.id}
                      checked={checked}
                      onChange={() => selectPackage(product.id)}
                    />
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-foreground">
                        {product.name}
                      </span>
                      {product.isRecommended ? <Badge tone="accent">Recommended</Badge> : null}
                    </span>
                    <span className="mt-1 block text-[15px] font-semibold text-foreground">
                      {packageLabel(product, currency)}
                    </span>
                    <span className="mt-1 block text-[11.5px] text-muted">{product.timeline}</span>
                  </label>
                );
              })}
            </fieldset>
          ) : null}

          {selectedPackage ? (
            <div className="mt-3 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Included in {selectedPackage.name}
              </p>
              <ul className="mt-1.5 grid gap-1 text-[12.5px] text-secondary sm:grid-cols-2">
                {selectedPackage.features.map((feature) => (
                  <li key={feature} className="flex gap-1.5">
                    <span aria-hidden="true" className="text-accent-soft">
                      •
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="project-title">Project title</Label>
            <Input
              id="project-title"
              value={projectTitle}
              onChange={(event) => setProjectTitle(event.target.value)}
              placeholder="e.g. Website redesign — 5 pages"
            />
          </div>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="project-description">Project description</Label>
            <Textarea
              id="project-description"
              value={projectDescription}
              onChange={(event) => setProjectDescription(event.target.value)}
              placeholder="One or two sentences describing the project for the client."
            />
          </div>
        </section>
<section className="rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-foreground">3. Additional line items</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-secondary">
                Only priced services you actually offer. Each line is a manual amount you enter —
                nothing is calculated from a template.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addLine}>
              <Plus aria-hidden="true" />
              Add line
            </Button>
          </div>

          {additionalLines.length === 0 ? (
            <p className="mt-3 text-[12.5px] text-muted">
              No additional lines. The selected package is the whole scope.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {additionalLines.map((line) => (
                <li
                  key={line.key}
                  className="rounded-[10px] border border-border-subtle bg-background/40 p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_80px_120px_36px] sm:items-end">
                    <div className="space-y-1">
                      <Label htmlFor={`line-desc-${line.key}`}>Description</Label>
                      <Input
                        id={`line-desc-${line.key}`}
                        value={line.description}
                        onChange={(event) =>
                          updateLine(line.key, { description: event.target.value })
                        }
                        placeholder="e.g. Booking form integration"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`line-qty-${line.key}`}>Qty</Label>
                      <Input
                        id={`line-qty-${line.key}`}
                        inputMode="numeric"
                        value={line.quantity}
                        onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`line-price-${line.key}`}>
                        Unit price ({currency.currencyCode})
                      </Label>
                      <Input
                        id={`line-price-${line.key}`}
                        inputMode="decimal"
                        value={line.unitPrice}
                        onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Remove ${line.description || "line item"}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <h2 className="text-[15px] font-semibold text-foreground">4. Terms</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-secondary">
            Nothing is defaulted: blank fields are omitted from the quotation. This application has
            no configured payment, warranty or tax policy, so it will not invent one.
          </p>
          <details className="mt-3 rounded-[10px] border border-border-subtle bg-background/40 p-3">
            <summary className="cursor-pointer text-[13px] font-medium text-secondary">
              Edit terms and scope notes
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {TERM_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`term-${field.key}`}>{field.label}</Label>
                  <Textarea
                    id={`term-${field.key}`}
                    value={terms[field.key]}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      setTerms((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          </details>
        </section>
</div>

      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <section className="rounded-card border border-border-subtle bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-foreground">Summary</h2>
            <Badge tone="neutral">{currency.currencyCode}</Badge>
          </div>

          <dl className="mt-3 space-y-1.5 text-[12.5px]">
            {selectedPackage ? (
              <div className="flex justify-between gap-2">
                <dt className="text-secondary">{selectedPackage.name}</dt>
                <dd className="text-foreground">{packageLabel(selectedPackage, currency)}</dd>
              </div>
            ) : null}

            {additionalLines
              .filter((line) => line.description.trim().length > 0)
              .map((line) => {
                const quantity = Math.max(1, Number.parseInt(line.quantity, 10) || 1);
                const amount = parseMajorAmount(line.unitPrice) ?? 0;
                return (
                  <div key={line.key} className="flex justify-between gap-2">
                    <dt className="min-w-0 truncate text-secondary">
                      {line.description} × {quantity}
                    </dt>
                    <dd className="text-foreground">
                      {formatMinorUnits(toMinorUnits(amount, currency.currencyCode), currency)}
                    </dd>
                  </div>
                );
              })}
          </dl>

          <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="discount-mode">Discount</Label>
              <Select
                id="discount-mode"
                value={discountMode}
                onChange={(event) => setDiscountMode(event.target.value as DiscountMode)}
              >
                <option value="none">No discount</option>
                <option value="fixed">Fixed amount</option>
                <option value="percent">Percentage</option>
              </Select>
              {discountMode !== "none" ? (
                <Input
                  aria-label={discountMode === "fixed" ? "Discount amount" : "Discount percent"}
                  inputMode="decimal"
                  value={discountValue}
                  placeholder={discountMode === "fixed" ? currency.currencyCode : "%"}
                  onChange={(event) => setDiscountValue(event.target.value)}
                />
              ) : null}
              <p className="text-[11px] leading-relaxed text-muted">
                Only the discount you enter here is applied. Nothing is discounted automatically.
              </p>
            </div>

            <dl className="space-y-1 text-[12.5px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-secondary">
                  {preview.totals
                    ? formatMinorUnits(preview.totals.subtotalMinor, currency)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Discount</dt>
                <dd className="text-secondary">
                  {preview.totals
                    ? formatMinorUnits(preview.totals.discountAmountMinor, currency)
                    : "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 pt-1">
                <dt className="text-[13px] font-medium text-foreground">Total</dt>
                <dd className="text-xl font-semibold text-foreground">
                  {preview.totals ? formatMinorUnits(preview.totals.totalMinor, currency) : "—"}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] leading-relaxed text-muted">
              No tax is calculated and no currency conversion is performed. All line items in one
              quotation share one currency.
            </p>
          </div>

          <div className="mt-3 space-y-1.5">
            <Label htmlFor="valid-until">Valid until (optional)</Label>
            <Input
              id="valid-until"
              type="date"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </div>

          {preview.error ? (
            <Alert tone="warning" className="mt-3" title="This quotation cannot be saved yet">
              {preview.error}
            </Alert>
          ) : null}

          {error ? (
            <Alert tone="danger" className="mt-3" title="The quotation was not saved">
              {error}
            </Alert>
          ) : null}

          {fieldErrors.length > 0 ? (
            <ul className="mt-3 space-y-1 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {fieldErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <Button type="submit" loading={saving} disabled={!preview.totals}>
              <Save aria-hidden="true" />
              {mode === "edit" ? "Save changes" : "Create quotation"}
            </Button>
            <Button asChild variant="ghost">
              <Link href={mode === "edit" && quote ? `/quotes/${quote.id}` : "/quotes"}>
                <X aria-hidden="true" />
                Cancel
              </Link>
            </Button>
          </div>
        </section>

        <section className="rounded-card border border-border-subtle bg-surface/60 p-4">
          <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Prices come from the Pricing Library. The server recalculates every total on save, so a
              browser-submitted amount is never trusted. A saved quotation keeps the prices it was
              saved with.
            </span>
          </p>
        </section>
      </aside>
    </form>
  );
}