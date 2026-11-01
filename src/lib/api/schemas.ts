import { z } from "zod";
import {
  CALLBOOK_GOALS,
  CALLBOOK_LANGUAGES,
  CALL_NODE_TYPES,
  CALL_STEP_TYPES,
} from "@/lib/callbooks/types";
import { OUTCOME_KEYS } from "@/lib/callbooks/outcomes";

const idSchema = z.string().trim().min(1).max(64);

const branchSchema = z.object({
  id: idSchema,
  label: z.string().max(120),
  examplePhrases: z.array(z.string().max(300)).max(30),
  nextNodeId: idSchema.nullable(),
  sortOrder: z.number().int().min(0).max(10_000),
});

const nodeSchema = z.object({
  id: idSchema,
  type: z.enum(CALL_NODE_TYPES),
  title: z.string().max(120),
  script: z.string().max(8000),
  internalNote: z.string().max(4000).nullable(),
  position: z.object({
    x: z.number().min(-50_000).max(50_000),
    y: z.number().min(-50_000).max(50_000),
  }),
  outcomeKey: z.string().max(60).nullable(),
  branches: z.array(branchSchema).max(40),
  sortOrder: z.number().int().min(0).max(10_000),
  // Phase 2 step context. Optional so a client that predates these fields (or an
  // existing draft) can still save; the route normalises them before persistence.
  stepType: z.enum(CALL_STEP_TYPES).nullable().optional(),
  purpose: z.string().max(2000).nullable().optional(),
  talkingPoints: z.array(z.string().max(500)).max(20).optional(),
});

export const graphSchema = z
  .object({
    startNodeId: idSchema.nullable(),
    nodes: z.array(nodeSchema).max(300),
  })
  .superRefine((graph, ctx) => {
    const nodeIds = new Set<string>();
    for (const node of graph.nodes) {
      if (nodeIds.has(node.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The same step was submitted twice. Reload the builder and try again.",
        });
      }
      nodeIds.add(node.id);
    }

    const branchIds = new Set<string>();
    for (const node of graph.nodes) {
      for (const branch of node.branches) {
        if (branchIds.has(branch.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "The same response was submitted twice. Reload the builder and try again.",
          });
        }
        branchIds.add(branch.id);
        if (branch.nextNodeId && !nodeIds.has(branch.nextNodeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A response points to a step that is not part of this Callbook.",
          });
        }
        if (branch.nextNodeId && branch.nextNodeId === node.id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A response cannot point back to the step it comes from.",
          });
        }
      }
    }

    if (graph.startNodeId && !nodeIds.has(graph.startNodeId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The starting step is not part of this Callbook.",
      });
    }
  });

const callbookContextShape = {
  marketId: idSchema.nullable().optional(),
  nicheCategoryId: idSchema.nullable().optional(),
  language: z.enum(CALLBOOK_LANGUAGES).nullable().optional(),
  internalNotes: z.string().max(4000).optional(),
};

export const createCallbookSchema = z.object({
  title: z.string().trim().min(1, "Give your Callbook a name.").max(120),
  targetAudience: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  primaryGoal: z.enum(CALLBOOK_GOALS),
  templateId: z.string().trim().max(80).nullable().optional(),
  ...callbookContextShape,
});

export const callbookMetaSchema = z
  .object({
    title: z.string().trim().min(1, "Give your Callbook a name.").max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    targetAudience: z.string().trim().max(200).optional(),
    primaryGoal: z.enum(CALLBOOK_GOALS).optional(),
    ...callbookContextShape,
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Nothing to update.",
  });

export const saveGraphSchema = z.object({ graph: graphSchema });

export const archiveSchema = z.object({ archived: z.boolean() });

export const startSessionSchema = z.object({
  prospectName: z.string().trim().max(200).nullable().optional(),
  /** Phase 3: start the call for a saved lead. Validated against the market. */
  leadId: z.string().trim().max(64).nullable().optional(),
});

export const advanceSchema = z.object({
  branchId: idSchema,
  responseText: z.string().max(500).nullable().optional(),
});

export const backSchema = z.object({}).optional();

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Write something before saving the note.").max(2000),
});

export const unexpectedSchema = z.object({
  responseText: z.string().trim().min(1, "Record what the prospect said first.").max(500),
  note: z.string().trim().max(2000).nullable().optional(),
  branchId: idSchema.nullable().optional(),
});

export const finishSessionSchema = z.object({
  outcomeKey: z.enum(OUTCOME_KEYS),
  notes: z.string().max(8000).optional(),
  nextAction: z.string().max(200).nullable().optional(),
  followUpAt: z.string().max(40).nullable().optional(),
});