/**
 * Request validation for every write path in the Pricing Library and Session
 * Planner. Client forms validate for usability; these schemas are the mandatory
 * server-side gate.
 */

import { z } from "zod";
import { isValidDateOnly, isValidTimeWib } from "@/lib/guides/format";

const idSchema = z.string().trim().min(1).max(64);

const amountSchema = z
  .number({ invalid_type_error: "Enter an amount as a number." })
  .int("Prices must be whole numbers in the market's currency.")
  .min(0, "Prices cannot be negative.")
  .max(1_000_000_000, "That amount is too large.");

const labelSchema = z.string().trim().min(1, "Labels cannot be empty.").max(120);

export const sessionInputSchema = z.object({
  marketCode: z.string().trim().min(1, "Choose a market.").max(8),
  scheduleId: idSchema,
  nicheSlug: z.string().trim().min(1).max(80).nullable(),
  sessionDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a session date.")
    .refine(isValidDateOnly, "That date does not exist."),
  title: z.string().trim().min(1, "Give this session a title.").max(120),
  objective: z.string().trim().min(1, "Choose a session objective.").max(200),
  customNotes: z.string().max(2000, "Notes are limited to 2000 characters.").optional(),
});

export const packageUpdateSchema = z
  .object({
    priceAmount: amountSchema.optional(),
    isStartingPrice: z.boolean().optional(),
    timeline: z.string().trim().min(1, "Add the timeline shown in the guide.").max(120).optional(),
    isRecommended: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, { message: "Nothing to update." });

export const packageFeatureCreateSchema = z.object({
  featureText: z.string().trim().min(1, "Write the inclusion first.").max(300),
});

export const packageFeatureUpdateSchema = packageFeatureCreateSchema;

export const nichePriceUpdateSchema = z.object({ priceAmount: amountSchema });

export const nicheCategoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "The niche name cannot be empty.").max(120),
});

export const nicheServiceCreateSchema = z.object({
  name: z.string().trim().min(1, "Write the child label first.").max(120),
});

export const nicheServiceUpdateSchema = nicheServiceCreateSchema;

export const scheduleUpdateSchema = z
  .object({
    title: z.string().trim().min(1, "The schedule title cannot be empty.").max(200).optional(),
    startTimeWib: z
      .string()
      .trim()
      .refine(isValidTimeWib, "Use a 24-hour time such as 09:30.")
      .optional(),
    endTimeWib: z
      .string()
      .trim()
      .refine(isValidTimeWib, "Use a 24-hour time such as 09:30.")
      .optional(),
    localTimeLabel: z.string().max(120).nullable().optional(),
    timezoneLabel: z.string().max(120).nullable().optional(),
    cityLabels: z.array(labelSchema).min(1, "Add at least one target city.").max(40).optional(),
    priorityLabels: z
      .array(labelSchema)
      .min(1, "Add at least one priority focus.")
      .max(40)
      .optional(),
    scheduleNote: z.string().max(1000).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, { message: "Nothing to update." });

export const marketUpdateSchema = z
  .object({
    timezoneNote: z.string().max(1000).nullable().optional(),
    scheduleNoteReviewRequired: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, { message: "Nothing to update." });

export const guideItemCreateSchema = z.object({
  marketId: idSchema,
  text: z.string().trim().min(1, "Write the text first.").max(500),
  secondaryText: z.string().max(1000).optional(),
});

export const guideItemUpdateSchema = z.object({
  text: z.string().trim().min(1, "Write the text first.").max(500),
  secondaryText: z.string().max(1000).optional(),
});