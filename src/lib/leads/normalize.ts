/**
 * Normalisation used only for duplicate **warnings**.
 *
 * Nothing here merges or rewrites records: two leads are reported as possible
 * duplicates and the user decides. Values are stored alongside the lead so the
 * lookup can use indexes instead of scanning the table.
 */

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Heuristic comparison key for phone numbers: digits only, then the last nine
 * digits so that local and international spellings of the same line tend to match
 * ("0812-3456-7890" vs "+62 812 3456 7890").
 */
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export function normalizeEmail(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase();
}

/** Hostname only: no protocol, no `www.`, no path or query. */
export function normalizeDomain(value: string | null | undefined): string {
  if (!value) return "";
  let candidate = value.trim().toLowerCase();
  if (!candidate) return "";
  candidate = candidate.replace(/^[a-z]+:\/\//, "");
  candidate = candidate.split("/")[0] ?? "";
  candidate = candidate.split("?")[0] ?? "";
  candidate = candidate.replace(/^www\./, "");
  return candidate;
}

/** Validates and stores a website URL the user typed; `null` when empty. */
export function normalizeWebsiteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname.includes(".")) return null;
  return parsed.toString().replace(/\/$/, "");
}

/** Normalises the identifiers stored on a lead row. */
export function leadMatchKeys(input: {
  businessName: string;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}) {
  return {
    name: normalizeName(input.businessName),
    city: normalizeName(input.city ?? ""),
    phone: normalizePhone(input.phone),
    email: normalizeEmail(input.email),
    domain: normalizeDomain(input.website),
  };
}