/**
 * Domain types for the Pricing Library and Session Planner.
 *
 * These mirror the D1 schema in `migrations/0002_guide_data_schema.sql`. There is
 * no second source of business data in the frontend: every value here is loaded
 * from the database by `repository.ts`.
 */

export const MARKET_CODES = ["ID", "AU", "USA"] as const;
export type MarketCode = (typeof MARKET_CODES)[number];

export const GOAL_KINDS = ["call_objective", "session_goal"] as const;
export type GoalKind = (typeof GOAL_KINDS)[number];

export type Market = {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  currencyLabel: string;
  recommendedPackageId: string | null;
  targetPriceAmount: number;
  targetPriceIsMinimum: boolean;
  /** Source schedule caveat, stored verbatim (USA daylight-saving note). */
  timezoneNote: string | null;
  /** When true the UI shows the non-blocking "verify the schedule" warning. */
  scheduleNoteReviewRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketSchedule = {
  id: string;
  marketId: string;
  scheduleCode: string;
  title: string;
  startTimeWib: string;
  endTimeWib: string;
  localTimeLabel: string | null;
  timezoneLabel: string | null;
  cityLabels: string[];
  priorityLabels: string[];
  scheduleNote: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NicheService = {
  id: string;
  nicheCategoryId: string;
  name: string;
  sortOrder: number;
};

export type NicheCategory = {
  id: string;
  marketId: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  services: NicheService[];
};

export type PackageFeature = {
  id: string;
  packageId: string;
  featureText: string;
  sortOrder: number;
};

export type Package = {
  id: string;
  marketId: string;
  slug: string;
  name: string;
  priceAmount: number;
  isStartingPrice: boolean;
  timeline: string;
  isRecommended: boolean;
  displayOrder: number;
  isActive: boolean;
  features: PackageFeature[];
  createdAt: string;
  updatedAt: string;
};

export type NichePriceRow = {
  id: string;
  marketId: string;
  nicheCategoryId: string | null;
  nicheLabel: string;
  packageId: string;
  priceAmount: number;
  sourceOrder: number;
};

export type GuideGoal = {
  id: string;
  marketId: string;
  kind: GoalKind;
  goalText: string;
  sortOrder: number;
};

export type GuideChecklistItem = {
  id: string;
  marketId: string;
  itemText: string;
  sortOrder: number;
};

export type GuideObjection = {
  id: string;
  marketId: string;
  objectionText: string;
  suggestedResponse: string;
  sortOrder: number;
};

export type GuideTool = {
  id: string;
  marketId: string;
  toolName: string;
  toolDescription: string;
  sortOrder: number;
};

/** Everything one market contributes to pricing and session planning. */
export type MarketGuide = {
  market: Market;
  schedules: MarketSchedule[];
  packages: Package[];
  nicheCategories: NicheCategory[];
  nichePriceRows: NichePriceRow[];
  callObjectives: GuideGoal[];
  sessionGoals: GuideGoal[];
  checklist: GuideChecklistItem[];
  objections: GuideObjection[];
  tools: GuideTool[];
};

export type SessionRecord = {
  id: string;
  title: string;
  marketId: string;
  scheduleId: string | null;
  sessionDate: string;
  selectedNicheLabel: string | null;
  objective: string;
  customNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type NichePriceGroup = {
  label: string;
  sourceOrder: number;
  prices: Array<{ packageId: string; packageName: string; priceAmount: number }>;
};

/** The immutable record of what a session showed when it was saved. */
export type SessionSnapshot = {
  version: 1;
  capturedAt: string;
  market: {
    code: string;
    name: string;
    currencyCode: string;
    currencyLabel: string;
    timezoneNote: string | null;
    scheduleNoteReviewRequired: boolean;
  };
  schedule: {
    id: string;
    title: string;
    startTimeWib: string;
    endTimeWib: string;
    localTimeLabel: string | null;
    timezoneLabel: string | null;
    cityLabels: string[];
    priorityLabels: string[];
    scheduleNote: string | null;
  } | null;
  niche: {
    slug: string | null;
    name: string | null;
    services: string[];
  };
  objective: string;
  recommendedPackage: {
    id: string;
    name: string;
    priceAmount: number;
    /** The market's standard price for this package, for comparison. */
    standardPriceAmount: number;
    isStartingPrice: boolean;
    timeline: string;
    features: string[];
  } | null;
  /** `niche` = the source guide supplied a specialty row, `standard` = base price. */
  priceSource: "niche" | "standard" | "unconfigured";
  nichePriceGroups: NichePriceGroup[];
  packages: Array<{
    id: string;
    name: string;
    priceAmount: number;
    isStartingPrice: boolean;
    timeline: string;
    isRecommended: boolean;
    features: string[];
  }>;
  callObjectives: string[];
  sessionGoals: string[];
  checklist: string[];
  objections: Array<{ objectionText: string; suggestedResponse: string }>;
  tools: Array<{ toolName: string; toolDescription: string }>;
  notes: string;
};

/** A saved session plus the pricing/guide data frozen when it was saved. */
export type SessionDetail = SessionRecord & {
  marketCode: string;
  marketName: string;
  currencyCode: string;
  currencyLabel: string;
  snapshot: SessionSnapshot;
};

export type SessionListItem = SessionDetail;

export type SeedValidationCheck = {
  label: string;
  expected: string;
  actual: string;
  ok: boolean;
};

export type SeedValidationReport = {
  ok: boolean;
  checks: SeedValidationCheck[];
  totals: {
    markets: number;
    schedules: number;
    packages: number;
    packageFeatures: number;
    nicheCategories: number;
    nicheServices: number;
    nichePriceRows: number;
    nichePriceLabels: number;
    callObjectives: number;
    sessionGoals: number;
    checklistItems: number;
    objections: number;
    tools: number;
    sessions: number;
  };
};