import { DatabaseNotConfiguredError } from "@/lib/db";

/**
 * Turns a server-side data failure into a message a user can act on.
 * Nothing here hides the failure: the pages render these messages instead of
 * falling back to empty data.
 */
export function describeDataError(error: unknown, fallback: string): string {
  if (error instanceof DatabaseNotConfiguredError) {
    return (
      "The database is not configured. Bind a Cloudflare D1 database named `DB` " +
      "(see README) and apply the migrations."
    );
  }
  console.error("[data] request failed", error);
  return fallback;
}