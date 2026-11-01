/**
 * Outcome categories are defined once, centrally, and referenced by key
 * everywhere else (callbook outcome nodes, call session results, filters).
 */

export const OUTCOME_KEYS = [
  "meeting_booked",
  "follow_up_later",
  "interested_no_meeting",
  "not_interested",
  "no_answer",
  "wrong_number",
  "disqualified",
  "other",
] as const;

export type OutcomeKey = (typeof OUTCOME_KEYS)[number];

export type OutcomeTone = "success" | "warning" | "info" | "danger" | "neutral";

export type OutcomeDefinition = {
  key: OutcomeKey;
  label: string;
  tone: OutcomeTone;
  description: string;
  /** A follow-up date/time is meaningful for these outcomes. */
  suggestsFollowUp: boolean;
};

export const OUTCOMES: readonly OutcomeDefinition[] = [
  {
    key: "meeting_booked",
    label: "Meeting booked",
    tone: "success",
    description: "The prospect agreed to a meeting or call.",
    suggestsFollowUp: true,
  },
  {
    key: "follow_up_later",
    label: "Follow up later",
    tone: "warning",
    description: "The prospect asked to be contacted again at a later date.",
    suggestsFollowUp: true,
  },
  {
    key: "interested_no_meeting",
    label: "Interested — no meeting yet",
    tone: "info",
    description: "Interest shown, but nothing is scheduled.",
    suggestsFollowUp: true,
  },
  {
    key: "not_interested",
    label: "Not interested",
    tone: "danger",
    description: "The prospect declined the offer.",
    suggestsFollowUp: false,
  },
  {
    key: "no_answer",
    label: "No answer",
    tone: "neutral",
    description: "Nobody answered, or the call did not connect.",
    suggestsFollowUp: true,
  },
  {
    key: "wrong_number",
    label: "Wrong number",
    tone: "neutral",
    description: "The number reached someone unrelated to the business.",
    suggestsFollowUp: false,
  },
  {
    key: "disqualified",
    label: "Disqualified",
    tone: "neutral",
    description: "The business does not fit the offer (size, location, budget).",
    suggestsFollowUp: false,
  },
  {
    key: "other",
    label: "Other",
    tone: "neutral",
    description: "Anything else — describe it in the notes.",
    suggestsFollowUp: false,
  },
];

const OUTCOME_BY_KEY: Record<OutcomeKey, OutcomeDefinition> = OUTCOMES.reduce(
  (acc, outcome) => {
    acc[outcome.key] = outcome;
    return acc;
  },
  {} as Record<OutcomeKey, OutcomeDefinition>,
);

export function isOutcomeKey(value: unknown): value is OutcomeKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(OUTCOME_BY_KEY, value);
}

export function getOutcome(key: string | null | undefined): OutcomeDefinition | null {
  if (!isOutcomeKey(key)) return null;
  return OUTCOME_BY_KEY[key];
}

export function outcomeLabel(key: string | null | undefined): string {
  const outcome = getOutcome(key);
  return outcome ? outcome.label : "Not recorded";
}

const TONE_CLASSES: Record<OutcomeTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
  danger: "border-danger/30 bg-danger/10 text-danger",
  neutral: "border-border-subtle bg-surface-elevated text-secondary",
};

export function outcomeToneClasses(key: string | null | undefined): string {
  const outcome = getOutcome(key);
  return TONE_CLASSES[outcome ? outcome.tone : "neutral"];
}

export function outcomeLabelForNode(outcomeKey: string | null): string {
  return outcomeLabel(outcomeKey);
}