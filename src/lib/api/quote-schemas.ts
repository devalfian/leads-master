/**
 * Request validation for Quote Builder.
 *
 * Totals are deliberately absent from these schemas: the browser never submits a
 * total. Prices and totals are recalculated on the server from the pricing
 * database and the shared calculation utility.
 */

import { z } from "zod";
import { MAX_QUANTITY } from "@/lib/quotes/money";
import { QUOTE_STATUSES } from "@/lib/quotes/types";

const idSchema = z.string().trim().min(1).max(64);

const quantitySchema = z
  .number({ invalid_type_error: "Enter the quantity as a number." })
  .int("Quantity must be a whole number.")
  .min(1, "Quantity must be at least 1.")
  .max(MAX_QUANTITY, `Quantity cannot be more than ${MAX_QUANTITY}.`);

const packageLineSchema = z.object({
  lineType: z.literal("package"),
  sourcePackageId: idSchema,
  quantity: quantitySchema,
});

const customLineSchema = z.object({
  lineType: z.literal("custom"),
  description: z.string().trim().min(1, "Describe this line item.").max(200),
  quantity: quantitySchema,
  unitPriceMajor: z
    .number({ invalid_type_error: "Enter a price as a number." })
    .min(0, "A price cannot be negative.")
    .max(1_000_000_000, "That price is too large."),
});

export const quoteLineInputSchema = z.discriminatedUnion("lineType", [
  packageLineSchema,
  customLineSchema,
]);

const clientSnapshotSchema = z
  .object({
    businessName: z.string().trim().max(160).optional(),
    contactName: z.string().trim().max(200).nullable().optional(),
    email: z.string().trim().max(200).nullable().optional(),
    phone: z.string().trim().max(60).nullable().optional(),
    address: z.string().trim().max(240).nullable().optional(),
    city: z.string().trim().max(120).nullable().optional(),
  })
  .optional();

const termsSchema = z
  .object({
    timeline: z.string().max(2000).optional(),
    revisions: z.string().max(2000).optional(),
    paymentTerms: z.string().max(2000).optional(),
    hosting: z.string().max(2000).optional(),
    domain: z.string().max(2000).optional(),
    maintenance: z.string().max(2000).optional(),
    exclusions: z.string().max(2000).optional(),
    clientResponsibilities: z.string().max(2000).optional(),
    additionalWork: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
  })
  .optional();

const discountSchema = z
  .discriminatedUnion("type", [
    z.object({ type: z.literal("none") }),
    z.object({
      type: z.literal("fixed"),
      amountMajor: z
        .number({ invalid_type_error: "Enter the discount as a number." })
        .min(0, "A discount cannot be negative.")
        .max(1_000_000_000),
    }),
    z.object({
      type: z.literal("percent"),
      // Basis points: 1000 = 10%. Whole basis points keep the maths exact.
      percentBp: z.number().int().min(0).max(10_000),
    }),
  ])
  .optional();

export const quoteWriteSchema = z.object({
  leadId: idSchema,
  primaryPackageId: idSchema,
  additionalLines: z.array(quoteLineInputSchema).max(20).optional(),
  projectTitle: z.string().trim().min(1, "Give this quotation a project title.").max(160),
  projectDescription: z.string().max(2000).optional(),
  client: clientSnapshotSchema,
  terms: termsSchema,
  discount: discountSchema,
  validUntil: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid-until date.")
    .nullable()
    .optional(),
  sourceCallId: idSchema.nullable().optional(),
  sourceSessionId: idSchema.nullable().optional(),
});

export const quoteStatusSchema = z.object({
  status: z.enum(QUOTE_STATUSES),
  note: z.string().max(500).nullable().optional(),
});