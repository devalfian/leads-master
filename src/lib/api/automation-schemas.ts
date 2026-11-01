/**
 * Request validation for the automation endpoints.
 *
 * Only two things can be changed: whether a rule runs, and its numeric window.
 * Rule logic itself lives in code, so there is no schema drift to worry about.
 */

import { z } from "zod";

export const rulePatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    config: z
      .record(
        z
          .number({ invalid_type_error: "Enter the setting as a number." })
          .int("Use a whole number of days."),
      )
      .optional(),
  })
  .refine((patch) => patch.enabled !== undefined || patch.config !== undefined, {
    message: "Nothing to update.",
  });