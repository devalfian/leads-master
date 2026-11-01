/** Shared result contract between route handlers and browser code. */

export type ApiError = {
  message: string;
  code?: string;
  /** Field-level details, e.g. validation issues. */
  details?: string[];
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function isApiFailure<T>(result: ApiResult<T>): result is { ok: false; error: ApiError } {
  return !result.ok;
}