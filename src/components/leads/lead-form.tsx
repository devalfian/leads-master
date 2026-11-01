"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { apiRequest } from "@/lib/api/client";
import { submitWrite } from "@/lib/offline/client";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@/lib/leads/types";
import type { CallbookMarketOption } from "@/lib/callbooks/types";

type DuplicateLead = {
  id: string;
  businessName: string;
  city: string | null;
  status: LeadStatus;
};

export function LeadForm({
  markets,
  mode,
  initial,
}: {
  markets: CallbookMarketOption[];
  mode: "create" | "edit";
  initial?: Lead;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [contactRole, setContactRole] = useState(initial?.contactRole ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [marketId, setMarketId] = useState(initial?.marketId ?? markets[0]?.id ?? "");
  const [nicheCategoryId, setNicheCategoryId] = useState(initial?.nicheCategoryId ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [status, setStatus] = useState<LeadStatus>(initial?.status ?? "new");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [estimatedValue, setEstimatedValue] = useState(
    initial?.estimatedValueAmount !== null && initial?.estimatedValueAmount !== undefined
      ? String(initial.estimatedValueAmount)
      : "",
  );
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const market = markets.find((entry) => entry.id === marketId) ?? markets[0] ?? null;
  const niches = market?.niches ?? [];

  // The duplicate check is advisory: it never blocks saving.
  useEffect(() => {
    if (!marketId || !businessName.trim()) {
      setDuplicates([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ marketId, name: businessName.trim() });
      if (city.trim()) params.set("city", city.trim());
      if (phone.trim()) params.set("phone", phone.trim());
      if (email.trim()) params.set("email", email.trim());
      if (website.trim()) params.set("website", website.trim());
      if (initial?.id) params.set("excludeId", initial.id);

      const result = await apiRequest<{ leads: DuplicateLead[] }>(
        `/api/leads/duplicates?${params.toString()}`,
      );
      if (controller.signal.aborted) return;
      setDuplicates(result.ok ? result.data.leads : []);
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [businessName, city, phone, email, website, marketId, initial?.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError("A business name is required.");
      return;
    }
    if (!marketId) {
      setError("Choose the market this business belongs to.");
      return;
    }

    const digits = estimatedValue.trim() ? Number(estimatedValue.replace(/[^\d]/g, "")) : null;
    if (digits !== null && (!Number.isInteger(digits) || digits < 0)) {
      setError("The estimated value must be a whole, non-negative amount.");
      return;
    }

    const payload = {
      businessName: businessName.trim(),
      contactName: contactName.trim() || null,
      contactRole: contactRole.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      marketId,
      nicheCategoryId: nicheCategoryId || null,
      city: city.trim() || null,
      address: address.trim() || null,
      source: source.trim() || null,
      status,
      notes,
      estimatedValueAmount: digits,
    };

    setBusy(true);
    const editing = mode === "edit" && initial ? initial : null;
    const outcome = await submitWrite<{ lead: Lead }>({
      method: editing ? "PATCH" : "POST",
      url: editing ? `/api/leads/${editing.id}` : "/api/leads",
      body: payload,
      label: editing
        ? `Edit lead · ${payload.businessName}`
        : `New lead · ${payload.businessName}`,
    });
    setBusy(false);

    if (outcome.status === "queued") {
      // Stored on this device. The sync panel shows it as waiting, and the lead
      // appears once the change reaches the server.
      router.push("/leads");
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }

    router.push(`/leads/${outcome.result.data.lead.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {duplicates.length > 0 ? (
        <Alert tone="warning" title="Possible duplicates in this market">
          <p>Check these before creating a second record. Nothing was merged automatically.</p>
          <ul className="mt-2 space-y-1">
            {duplicates.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center gap-2">
                <TriangleAlert className="size-3" aria-hidden="true" />
                <Link
                  href={`/leads/${lead.id}`}
                  className="underline underline-offset-2 hover:text-warning"
                >
                  {lead.businessName}
                </Link>
                <span className="opacity-80">
                  {lead.city ? `· ${lead.city} ` : ""}· {LEAD_STATUS_LABELS[lead.status]}
                </span>
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <div className="space-y-4 rounded-card border border-border-subtle bg-surface p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-business">
              Business name <span className="text-danger">*</span>
            </Label>
            <Input
              id="lead-business"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              maxLength={160}
              required
              aria-required="true"
              placeholder="e.g. Riverside Dental Studio"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-city">City / service area</Label>
            <Input
              id="lead-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={120}
              placeholder="e.g. Riverside, Selangor"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-market">
              Market <span className="text-danger">*</span>
            </Label>
            <Select
              id="lead-market"
              value={marketId}
              onChange={(event) => {
                setMarketId(event.target.value);
                setNicheCategoryId("");
              }}
              required
            >
              <option value="">Choose a market…</option>
              {markets.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} — {entry.currencyCode}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-niche">Niche</Label>
            <Select
              id="lead-niche"
              value={nicheCategoryId}
              onChange={(event) => setNicheCategoryId(event.target.value)}
              disabled={!market}
            >
              <option value="">No niche set</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="lead-contact">Contact name</Label>
            <Input
              id="lead-contact"
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              maxLength={120}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-role">Role</Label>
            <Input
              id="lead-role"
              value={contactRole}
              onChange={(event) => setContactRole(event.target.value)}
              maxLength={120}
              placeholder="Owner, manager, marketing…"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">Phone</Label>
            <Input
              id="lead-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={40}
              placeholder="Optional"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={160}
              placeholder="Optional"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-website">Website</Label>
            <Input
              id="lead-website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              maxLength={300}
              placeholder="https://…"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-status">Status</Label>
            <Select
              id="lead-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as LeadStatus)}
            >
              {LEAD_STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {LEAD_STATUS_LABELS[entry]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-value">
              Estimated value ({market?.currencyCode ?? "market currency"})
            </Label>
            <Input
              id="lead-value"
              value={estimatedValue}
              onChange={(event) => setEstimatedValue(event.target.value)}
              inputMode="numeric"
              placeholder="Optional"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-source">Source</Label>
            <Input
              id="lead-source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              maxLength={120}
              placeholder="e.g. Google Maps"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-address">Address</Label>
          <Input
            id="lead-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            maxLength={240}
            placeholder="Optional"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lead-notes">Notes</Label>
          <Textarea
            id="lead-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="What you know about the business, research notes, anything useful before calling."
          />
          <FieldHint>
            Only the fields you fill in are stored — unknown details stay empty.
          </FieldHint>
        </div>
      </div>

      {error ? <Alert tone="danger" title="This lead was not saved">{error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={busy}>
          {mode === "edit" ? "Save changes" : "Create lead"}
        </Button>
        <Button asChild variant="ghost">
          <Link href={initial ? `/leads/${initial.id}` : "/leads"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}