import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { DatabaseNotConfiguredError, RepositoryError } from "@/lib/db";
import type { ApiError, ApiResult } from "./types";

export function jsonOk<T>(data: T, status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(
  message: string,
  status: number,
  code?: string,
  details?: string[],
): NextResponse<ApiResult<never>> {
  const error: ApiError = { message, code, details };
  return NextResponse.json({ ok: false, error }, { status });
}

const STATUS_BY_CODE: Record<string, number> = {
  not_found: 404,
  conflict: 409,
  archived: 409,
  session_finished: 409,
  at_start: 409,
  invalid_graph: 422,
  invalid_outcome: 422,
  invalid_follow_up: 422,
  branch_not_found: 422,
  branch_unconnected: 422,
  target_missing: 422,
  not_published: 409,
  corrupt_snapshot: 500,
  corrupt_session: 500,
  invalid_amount: 422,
  invalid_input: 422,
  invalid_status: 422,
  quote_locked: 409,
  not_saved: 500,
  has_calls: 409,
  do_not_contact: 409,
};

export function handleRouteError(error: unknown, context: string): NextResponse<ApiResult<never>> {
  if (error instanceof RepositoryError) {
    const status = STATUS_BY_CODE[error.code] ?? 400;
    return jsonError(error.message, status, error.code);
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => issue.message);
    return jsonError(
      details[0] ?? "Some of the submitted values are not valid.",
      422,
      "validation_failed",
      details,
    );
  }

  if (error instanceof DatabaseNotConfiguredError) {
    console.error(`[${context}] database not configured`, error);
    return jsonError(
      "The database is not configured. Bind a D1 database named `DB` and apply migrations.",
      503,
      "database_not_configured",
    );
  }

  console.error(`[${context}] unexpected error`, error);
  return jsonError("Something went wrong on the server. Your changes were not saved.", 500);
}

/** Parses a JSON body and validates it against a schema. */
export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        path: [],
        message: "The request body must be valid JSON.",
      },
    ]);
  }
  return schema.parse(payload);
}