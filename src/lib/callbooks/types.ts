/**
 * Canonical domain model for Call Playbooks.
 *
 * One model is used by the builder, the published snapshot, call mode and call
 * history. Database rows are mapped into these types at the repository boundary
 * (`src/lib/callbooks/repository.ts`) and every JSON column is validated there.
 */

export const CALLBOOK_GOALS = [
  "book_meeting",
  "qualify_prospect",
  "sell_service",
  "follow_up",
] as const;

export type CallbookGoal = (typeof CALLBOOK_GOALS)[number];

export const CALLBOOK_GOAL_LABELS: Record<CallbookGoal, string> = {
  book_meeting: "Book a meeting",
  qualify_prospect: "Qualify a potential client",
  sell_service: "Sell a service directly",
  follow_up: "Follow up with a prospect",
};

export const CALLBOOK_STATUSES = ["draft", "published", "archived"] as const;

export type CallbookStatus = (typeof CALLBOOK_STATUSES)[number];

export const CALLBOOK_STATUS_LABELS: Record<CallbookStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const CALL_NODE_TYPES = ["message", "outcome"] as const;

export type CallNodeType = (typeof CALL_NODE_TYPES)[number];

/**
 * Organisational category for a conversation step (Phase 2).
 *
 * These are labels for the author, not a mandatory sequence and not a validation
 * rule: any callbook may use any subset, in any order. `null` means unclassified,
 * which is what every step created before this field existed reports.
 */
export const CALL_STEP_TYPES = [
  "opening",
  "qualification",
  "discovery",
  "value_proposition",
  "demo_pitch",
  "pricing",
  "objection_handling",
  "closing",
  "follow_up",
  "end",
] as const;

export type CallStepType = (typeof CALL_STEP_TYPES)[number];

export const CALL_STEP_TYPE_LABELS: Record<CallStepType, string> = {
  opening: "Opening",
  qualification: "Qualification",
  discovery: "Discovery",
  value_proposition: "Value proposition",
  demo_pitch: "Demo pitch",
  pricing: "Pricing discussion",
  objection_handling: "Objection handling",
  closing: "Closing",
  follow_up: "Follow-up",
  end: "End of conversation",
};

export const CALLBOOK_LANGUAGES = ["en", "id"] as const;

export type CallbookLanguage = (typeof CALLBOOK_LANGUAGES)[number];

export const CALLBOOK_LANGUAGE_LABELS: Record<CallbookLanguage, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

export type CallNodePosition = {
  x: number;
  y: number;
};

/** A possible prospect response that leads to the next conversation node. */
export type CallBranch = {
  id: string;
  label: string;
  examplePhrases: string[];
  /** `null` means the branch is still unconnected (a draft-only state). */
  nextNodeId: string | null;
  sortOrder: number;
};

export type CallNode = {
  id: string;
  type: CallNodeType;
  title: string;
  script: string;
  internalNote: string | null;
  position: CallNodePosition;
  /** Set for `outcome` nodes, `null` for `message` nodes. */
  outcomeKey: string | null;
  branches: CallBranch[];
  sortOrder: number;
  /** Optional organisational category (Phase 2); `null` = unclassified. */
  stepType: CallStepType | null;
  /** Why this step exists. Optional, never used for validation. */
  purpose: string | null;
  /** Optional bullets shown next to the script in the builder and live call. */
  talkingPoints: string[];
};

export type CallbookGraph = {
  startNodeId: string | null;
  nodes: CallNode[];
};

/** Market / niche labels joined from the Phase 1 guide tables (read-only). */
export type CallbookGuideRefs = {
  marketCode: string | null;
  marketName: string | null;
  nicheName: string | null;
};

/**
 * Serializable market + niche options for the Callbook selectors.
 *
 * Built on the server from the Phase 1 guide data and passed down as plain props,
 * so the client never keeps a second market/niche catalog of its own.
 */
export type CallbookMarketOption = {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  niches: Array<{ id: string; name: string }>;
};

export type CallbookMeta = {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  primaryGoal: CallbookGoal;
  status: CallbookStatus;
  startNodeId: string | null;
  publishedVersion: number;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Phase 2 context: references the guide data, `null` for older callbooks. */
  marketId: string | null;
  nicheCategoryId: string | null;
  language: CallbookLanguage | null;
  internalNotes: string;
};

export type Callbook = CallbookMeta &
  CallbookGuideRefs & {
    graph: CallbookGraph;
    hasPublishedSnapshot: boolean;
    hasUnpublishedChanges: boolean;
  };

export type CallbookSummary = CallbookMeta &
  CallbookGuideRefs & {
    nodeCount: number;
    branchCount: number;
    completedSessionCount: number;
    hasPublishedSnapshot: boolean;
    hasUnpublishedChanges: boolean;
  };

export const CALL_SESSION_STATUSES = ["in_progress", "completed", "abandoned"] as const;

export type CallSessionStatus = (typeof CALL_SESSION_STATUSES)[number];

export const SESSION_STEP_KINDS = ["start", "advance", "back", "unexpected", "restart"] as const;

export type SessionStepKind = (typeof SESSION_STEP_KINDS)[number];

export type CallSessionStep = {
  id: string;
  sessionId: string;
  kind: SessionStepKind;
  fromNodeId: string | null;
  branchId: string | null;
  toNodeId: string | null;
  /** Response label of the selected branch, denormalised for history rendering. */
  label: string | null;
  responseText: string | null;
  sortOrder: number;
  createdAt: string;
};

export type CallSessionNote = {
  id: string;
  sessionId: string;
  body: string;
  createdAt: string;
};

export type CallSession = {
  id: string;
  callbookId: string;
  callbookTitle: string;
  publishedVersion: number;
  prospectName: string | null;
  /** Lead this call belongs to, when it was started from a lead record. */
  leadId: string | null;
  status: CallSessionStatus;
  currentNodeId: string | null;
  path: string[];
  notes: string;
  outcomeKey: string | null;
  nextAction: string | null;
  followUpAt: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CallSessionDetail = CallSession & {
  snapshot: SessionSnapshot;
  steps: CallSessionStep[];
  quickNotes: CallSessionNote[];
};

/** Immutable conversation graph captured at publication time. */
export type SessionSnapshot = {
  version: number;
  callbookId: string;
  callbookTitle: string;
  capturedAt: string;
  startNodeId: string;
  nodes: CallNode[];
};

export function isCallbookGoal(value: unknown): value is CallbookGoal {
  return typeof value === "string" && (CALLBOOK_GOALS as readonly string[]).includes(value);
}

export function isCallbookStatus(value: unknown): value is CallbookStatus {
  return typeof value === "string" && (CALLBOOK_STATUSES as readonly string[]).includes(value);
}

export function isCallNodeType(value: unknown): value is CallNodeType {
  return typeof value === "string" && (CALL_NODE_TYPES as readonly string[]).includes(value);
}

export function isCallStepType(value: unknown): value is CallStepType {
  return typeof value === "string" && (CALL_STEP_TYPES as readonly string[]).includes(value);
}

export function isCallbookLanguage(value: unknown): value is CallbookLanguage {
  return typeof value === "string" && (CALLBOOK_LANGUAGES as readonly string[]).includes(value);
}

export function isSessionStepKind(value: unknown): value is SessionStepKind {
  return typeof value === "string" && (SESSION_STEP_KINDS as readonly string[]).includes(value);
}

export function isCallSessionStatus(value: unknown): value is CallSessionStatus {
  return (
    typeof value === "string" && (CALL_SESSION_STATUSES as readonly string[]).includes(value)
  );
}