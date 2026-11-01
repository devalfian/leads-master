import { Badge } from "@/components/ui/badge";
import {
  QUOTE_DISPLAY_STATUS_LABELS,
  QUOTE_STATUS_TONES,
  type QuoteDisplayStatus,
} from "@/lib/quotes/types";

/** Status pill. "Expired" is derived for display only and never stored. */
export function QuoteStatusBadge({ status }: { status: QuoteDisplayStatus }) {
  return <Badge tone={QUOTE_STATUS_TONES[status]}>{QUOTE_DISPLAY_STATUS_LABELS[status]}</Badge>;
}