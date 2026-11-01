/**
 * Session snapshots.
 *
 * A snapshot is written once, when a session is created (or edited), and is then
 * read back verbatim. Later master-data edits cannot change a saved plan, which
 * is what makes historical sessions trustworthy.
 */

import { z } from "zod";
import type { MarketGuide, MarketSchedule, NicheCategory, SessionSnapshot } from "./types";
import { resolveNichePriceGroups, resolveSessionPricing } from "./pricing";

export function buildSnapshot({
  guide,
  schedule,
  category,
  objective,
  notes,
  capturedAt,
}: {
  guide: MarketGuide;
  schedule: MarketSchedule;
  category: NicheCategory | null;
  objective: string;
  notes: string;
  capturedAt: string;
}): SessionSnapshot {
  const pricing = resolveSessionPricing(guide, category);
  const nichePriceGroups = resolveNichePriceGroups(category, guide.nichePriceRows, guide.packages);
  const recommended = pricing.recommendedPackage;

  return {
    version: 1,
    capturedAt,
    market: {
      code: guide.market.code,
      name: guide.market.name,
      currencyCode: guide.market.currencyCode,
      currencyLabel: guide.market.currencyLabel,
      timezoneNote: guide.market.timezoneNote,
      scheduleNoteReviewRequired: guide.market.scheduleNoteReviewRequired,
    },
    schedule: {
      id: schedule.id,
      title: schedule.title,
      startTimeWib: schedule.startTimeWib,
      endTimeWib: schedule.endTimeWib,
      localTimeLabel: schedule.localTimeLabel,
      timezoneLabel: schedule.timezoneLabel,
      cityLabels: [...schedule.cityLabels],
      priorityLabels: [...schedule.priorityLabels],
      scheduleNote: schedule.scheduleNote,
    },
    niche: {
      slug: category?.slug ?? null,
      name: category?.name ?? null,
      services: category ? category.services.map((service) => service.name) : [],
    },
    objective,
    recommendedPackage: recommended
      ? {
          id: recommended.id,
          name: recommended.name,
          priceAmount: pricing.amount ?? recommended.priceAmount,
          standardPriceAmount: recommended.priceAmount,
          isStartingPrice: recommended.isStartingPrice,
          timeline: recommended.timeline,
          features: recommended.features.map((feature) => feature.featureText),
        }
      : null,
    priceSource: pricing.priceSource,
    nichePriceGroups,
    packages: guide.packages.map((product) => ({
      id: product.id,
      name: product.name,
      priceAmount: product.priceAmount,
      isStartingPrice: product.isStartingPrice,
      timeline: product.timeline,
      isRecommended: product.id === guide.market.recommendedPackageId,
      features: product.features.map((feature) => feature.featureText),
    })),
    callObjectives: guide.callObjectives.map((goal) => goal.goalText),
    sessionGoals: guide.sessionGoals.map((goal) => goal.goalText),
    checklist: guide.checklist.map((item) => item.itemText),
    objections: guide.objections.map((objection) => ({
      objectionText: objection.objectionText,
      suggestedResponse: objection.suggestedResponse,
    })),
    tools: guide.tools.map((tool) => ({
      toolName: tool.toolName,
      toolDescription: tool.toolDescription,
    })),
    notes,
  };
}

export function serializeSnapshot(snapshot: SessionSnapshot): string {
  return JSON.stringify(snapshot);
}

/* -------------------------------------------------------------------------- */
/* Parsing                                                                    */
/* -------------------------------------------------------------------------- */

const stringArray = z.array(z.string());

const nichePriceGroupSchema = z.object({
  label: z.string(),
  sourceOrder: z.number().int(),
  prices: z.array(
    z.object({
      packageId: z.string(),
      packageName: z.string(),
      priceAmount: z.number().int().min(0),
    }),
  ),
});

export const sessionSnapshotSchema = z.object({
  version: z.literal(1),
  capturedAt: z.string(),
  market: z.object({
    code: z.string(),
    name: z.string(),
    currencyCode: z.string(),
    currencyLabel: z.string(),
    timezoneNote: z.string().nullable(),
    scheduleNoteReviewRequired: z.boolean(),
  }),
  schedule: z
    .object({
      id: z.string(),
      title: z.string(),
      startTimeWib: z.string(),
      endTimeWib: z.string(),
      localTimeLabel: z.string().nullable(),
      timezoneLabel: z.string().nullable(),
      cityLabels: stringArray,
      priorityLabels: stringArray,
      scheduleNote: z.string().nullable(),
    })
    .nullable(),
  niche: z.object({
    slug: z.string().nullable(),
    name: z.string().nullable(),
    services: stringArray,
  }),
  objective: z.string(),
  recommendedPackage: z
    .object({
      id: z.string(),
      name: z.string(),
      priceAmount: z.number().int().min(0),
      standardPriceAmount: z.number().int().min(0),
      isStartingPrice: z.boolean(),
      timeline: z.string(),
      features: stringArray,
    })
    .nullable(),
  priceSource: z.enum(["niche", "standard", "unconfigured"]),
  nichePriceGroups: z.array(nichePriceGroupSchema),
  packages: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      priceAmount: z.number().int().min(0),
      isStartingPrice: z.boolean(),
      timeline: z.string(),
      isRecommended: z.boolean(),
      features: stringArray,
    }),
  ),
  callObjectives: stringArray,
  sessionGoals: stringArray,
  checklist: stringArray,
  objections: z.array(z.object({ objectionText: z.string(), suggestedResponse: z.string() })),
  tools: z.array(z.object({ toolName: z.string(), toolDescription: z.string() })),
  notes: z.string(),
});

/** Returns `null` for anything that is not a snapshot this build understands. */
export function parseSnapshot(raw: string): SessionSnapshot | null {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = sessionSnapshotSchema.safeParse(payload);
  return result.success ? (result.data as SessionSnapshot) : null;
}

/**
 * The price a saved session presents. The snapshot stores the resolved amount,
 * so this never recalculates from current master data.
 */
export function snapshotPrice(snapshot: SessionSnapshot): number | null {
  return snapshot.recommendedPackage?.priceAmount ?? null;
}