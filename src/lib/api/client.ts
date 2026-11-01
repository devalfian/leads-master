import type { ApiResult } from "./types";

/**
 * Browser-side wrapper that always resolves to a typed result: callers never
 * have to guess whether a request failed or what the failure message is.
 */
export async function apiRequest<T>(
  url: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: {
        message: "Could not reach the server. Check your connection and try again.",
        code: "network_error",
      },
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        message: `The server returned an unexpected response (${response.status}).`,
        code: "invalid_response",
      },
    };
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "ok" in payload &&
    typeof (payload as { ok: unknown }).ok === "boolean"
  ) {
    return payload as ApiResult<T>;
  }

  return {
    ok: false,
    error: {
      message: `The server returned an unexpected response (${response.status}).`,
      code: "invalid_response",
    },
  };
}

export function apiPost<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPut<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(url: string, body?: unknown): Promise<ApiResult<T>> {
  return apiRequest<T>(url, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiDelete<T>(url: string): Promise<ApiResult<T>> {
  return apiRequest<T>(url, { method: "DELETE" });
}