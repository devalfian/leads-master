import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteForm } from "@/components/quotes/quote-form";
import { loadQuoteLeadOptions } from "@/lib/quotes/options";
import { describeDataError } from "@/lib/data-error";
import type { QuoteLeadOption } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Create quote" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * `?lead=` preselects the client when the user started from a lead detail page,
 * and `?call=` / `?session=` keep the provenance of the call that prompted the
 * quote. None of them are trusted for pricing: the package options still come
 * from the lead's own market.
 */
export default async function NewQuotePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const leadId = single(params.lead) || null;
  const sourceCallId = single(params.call) || null;
  const sourceSessionId = single(params.session) || null;

  let leads: QuoteLeadOption[] = [];
  let error: string | null = null;

  try {
    leads = await loadQuoteLeadOptions();
  } catch (loadError) {
    error = describeDataError(loadError, "The client list could not be loaded. Try again.");
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Quotes", href: "/quotes" },
          { label: "New" },
        ]}
        title="Create quote"
        description="Quote a website project for an existing lead. Prices are read from the Pricing Library and every total is recalculated on the server."
      />

      {error ? (
        <div className="px-5 py-6 md:px-8">
          <Alert tone="danger" title="The quotation form could not be prepared">
            {error}
          </Alert>
        </div>
      ) : leads.length === 0 ? (
        <div className="px-5 py-6 md:px-8">
          <EmptyState
            icon={FileText}
            title="Add a lead first"
            description="A quotation is always attached to an existing lead, so nothing is invented about the client."
            actions={
              <Button asChild>
                <Link href="/leads/new">Add a lead</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <QuoteForm
          leads={leads}
          mode="create"
          defaults={{ leadId, sourceCallId, sourceSessionId }}
        />
      )}
    </div>
  );
}