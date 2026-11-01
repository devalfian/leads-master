/**
 * Server-side validation for leads, logged calls and follow-ups.
 */

import { z } from "zod";
import { OUTCOME_KEYS } from "@/lib/callbooks/outcomes";
import { FOLLOW_UP_TYPES, LEAD_STATUSES } from "@/lib/leads/types";

const idSchema = z.string().trim().min(1).max(64);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

const estimatedValue = z
  .number({ invalid_type_error: "Enter the estimated value as a number." })
  .int("Use a whole amount in the market's currency.")
  .min(0, "The estimated value cannot be negative.")
  .max(1_000_000_000)
  .nullable()
  .optional();

const leadFields = {
  businessName: z.string().trim().min(1, "A business name is required.").max(160),
  contactName: optionalText(120),
  contactRole: optionalText(120),
  phone: optionalText(40),
  email: optionalText(160),
  website: optionalText(300),
  marketId: idSchema,
  nicheCategoryId: idSchema.nullable().optional(),
  city: optionalText(120),
  address: optionalText(240),
  source: optionalText(120),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(4000).optional(),
  estimatedValueAmount: estimatedValue,
  doNotContact: z.boolean().optional(),
};

export const leadCreateSchema = z.object(leadFields);

export const leadUpdateSchema = z
  .object({
    ...leadFields,
    businessName: leadFields.businessName.optional(),
    marketId: leadFields.marketId.optional(),
    archived: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, { message: "Nothing to update." });

export const logCallSchema = z.object({
  calledAt: z.string().trim().max(40).nullable().optional(),
  outcomeKey: z.enum(OUTCOME_KEYS),
  notes: z.string().max(4000).optional(),
  nextAction: optionalText(240),
  callbookId: idSchema.nullable().optional(),
  packageId: idSchema.nullable().optional(),
  markDoNotContact: z.boolean().optional(),
  /** Only ever set because the user chose it in the form. */
  status: z.enum(LEAD_STATUSES).nullable().optional(),
  followUp: z
    .object({
      dueAt: z.string().trim().min(1, "Choose a follow-up date.").max(40),
      type: z.enum(FOLLOW_UP_TYPES),
      notes: z.string().max(2000).optional(),
    })
    .nullable()
    .optional(),
});

export const followUpCreateSchema = z.object({
  dueAt: z.string().trim().min(1, "Choose a follow-up date.").max(40),
  type: z.enum(FOLLOW_UP_TYPES),
  notes: z.string().max(2000).optional(),
});

export const followUpUpdateSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled"]),
});

export const leadDuplicateQuerySchema = z.object({
  name: z.string().trim().max(160).optional(),
  city: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  website: z.string().trim().max(300).optional(),
  marketId: idSchema,
  excludeId: z.string().trim().max(64).optional(),
});