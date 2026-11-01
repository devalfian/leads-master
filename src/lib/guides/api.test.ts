import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Route-handler integration tests.
 *
 * The handlers are called directly with a real `Request`, so validation, the
 * repository, the snapshot and the JSON error contract are all exercised against
 * a real SQLite database — no HTTP server and no mocks.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-guides-api-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "api.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const { POST: createSessionRoute } = await import("@/app/api/sessions/route");
const { PATCH: updateSessionRoute, DELETE: deleteSessionRoute } = await import(
  "@/app/api/sessions/[id]/route"
);
const { POST: duplicateSessionRoute } = await import("@/app/api/sessions/[id]/duplicate/route");
const { PATCH: updatePackageRoute } = await import("@/app/api/pricing/packages/[id]/route");
const { PATCH: updateNicheRowRoute } = await import("@/app/api/pricing/niche-rows/[id]/route");
const { POST: createGuideItemRoute } = await import("@/app/api/guide-data/[resource]/route");
const { listMarketGuides } = await import("@/lib/guides/repository");

let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function params<T extends Record<string, string>>(values: T): { params: Promise<T> } {
  return { params: Promise.resolve(values) };
}

async function marketGuide(code: string) {
  const guides = await listMarketGuides();
  return guides.find((guide) => guide.market.code === code)!;
}

const validSession = {
  marketCode: "USA",
  scheduleId: "sched_usa_2",
  nicheSlug: "law-firm-professional",
  sessionDate: "2026-11-09",
  title: "Atlanta law firms",
  objective: "Memahami kebutuhan dan kondisi website saat ini.",
  customNotes: "Reference cards only.",
};

describe("POST /api/sessions", () => {
  it("creates a session and returns the stored snapshot", async () => {
    const response = await createSessionRoute(
      jsonRequest("http://test/api/sessions", "POST", validSession),
    );
    expect(response.status).toBe(201);

    const payload = await response.json();
    expect(payload.ok).toBe(true);
    const session = payload.data.session;
    expect(session.id).toMatch(/^session_/);
    expect(session.selectedNicheLabel).toBe("Law Firm & Professional");
    expect(session.snapshot.priceSource).toBe("niche");
    expect(session.snapshot.recommendedPackage.priceAmount).toBe(1500);
    expect(session.snapshot.schedule.cityLabels).toEqual(["Atlanta, Georgia", "Charlotte, NC"]);

    await deleteSessionRoute(
      jsonRequest(`http://test/api/sessions/${session.id}`, "DELETE"),
      params({ id: session.id }),
    );
  });

  it("rejects an impossible date with a field message", async () => {
    const response = await createSessionRoute(
      jsonRequest("http://test/api/sessions", "POST", {
        ...validSession,
        sessionDate: "2026-02-30",
      }),
    );
    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.error.message).toBe("That date does not exist.");
  });

  it("rejects a schedule from another market", async () => {
    const response = await createSessionRoute(
      jsonRequest("http://test/api/sessions", "POST", {
        ...validSession,
        marketCode: "ID",
        scheduleId: "sched_au_1",
      }),
    );
    expect(response.status).toBe(409);
    const payload = await response.json();
    expect(payload.error.message).toContain("does not belong to Indonesia");
  });

  it("rejects an objective that is not in the guide", async () => {
    const response = await createSessionRoute(
      jsonRequest("http://test/api/sessions", "POST", {
        ...validSession,
        objective: "Close them today.",
      }),
    );
    expect(response.status).toBe(409);
  });
});
describe("session edit, duplicate and delete routes", () => {
  it("patches, duplicates and deletes through the API", async () => {
    const created = await (
      await createSessionRoute(jsonRequest("http://test/api/sessions", "POST", validSession))
    ).json();
    const id = created.data.session.id;

    const patched = await updateSessionRoute(
      jsonRequest(`http://test/api/sessions/${id}`, "PATCH", {
        ...validSession,
        title: "Renamed session",
        sessionDate: "2026-11-10",
      }),
      params({ id }),
    );
    expect(patched.status).toBe(200);
    const patchedBody = await patched.json();
    expect(patchedBody.data.session.title).toBe("Renamed session");
    expect(patchedBody.data.session.sessionDate).toBe("2026-11-10");

    const duplicated = await duplicateSessionRoute(
      jsonRequest(`http://test/api/sessions/${id}/duplicate`, "POST"),
      params({ id }),
    );
    expect(duplicated.status).toBe(201);
    const duplicatedBody = await duplicated.json();
    expect(duplicatedBody.data.session.id).not.toBe(id);

    const removedCopy = await deleteSessionRoute(
      jsonRequest(`http://test/api/sessions/${duplicatedBody.data.session.id}`, "DELETE"),
      params({ id: duplicatedBody.data.session.id }),
    );
    expect(removedCopy.status).toBe(200);

    const removed = await deleteSessionRoute(
      jsonRequest(`http://test/api/sessions/${id}`, "DELETE"),
      params({ id }),
    );
    expect(removed.status).toBe(200);

    const missing = await deleteSessionRoute(
      jsonRequest(`http://test/api/sessions/${id}`, "DELETE"),
      params({ id }),
    );
    expect(missing.status).toBe(404);
  });
});

describe("pricing routes", () => {
  it("updates a base price without touching the niche grid", async () => {
    const guide = await marketGuide("USA");
    const starter = guide.packages.find((product) => product.name === "Starter")!;
    const lawFirmRow = guide.nichePriceRows.find(
      (row) => row.nicheLabel === "Law Firm" && row.packageId === starter.id,
    )!;

    const response = await updatePackageRoute(
      jsonRequest(`http://test/api/pricing/packages/${starter.id}`, "PATCH", { priceAmount: 425 }),
      params({ id: starter.id }),
    );
    expect(response.status).toBe(200);

    const refreshed = await marketGuide("USA");
    expect(refreshed.packages.find((product) => product.id === starter.id)?.priceAmount).toBe(425);
    expect(refreshed.nichePriceRows.find((row) => row.id === lawFirmRow.id)?.priceAmount).toBe(750);

    await updatePackageRoute(
      jsonRequest(`http://test/api/pricing/packages/${starter.id}`, "PATCH", { priceAmount: 400 }),
      params({ id: starter.id }),
    );
  });

  it("rejects a negative amount", async () => {
    const guide = await marketGuide("AU");
    const row = guide.nichePriceRows[0];
    const response = await updateNicheRowRoute(
      jsonRequest(`http://test/api/pricing/niche-rows/${row.id}`, "PATCH", { priceAmount: -1 }),
      params({ id: row.id }),
    );
    expect(response.status).toBe(422);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
  });

  it("returns 404 for an unknown package", async () => {
    const response = await updatePackageRoute(
      jsonRequest("http://test/api/pricing/packages/does-not-exist", "PATCH", { priceAmount: 1 }),
      params({ id: "does-not-exist" }),
    );
    expect(response.status).toBe(404);
  });
});

describe("guide-data routes", () => {
  it("rejects an unknown collection", async () => {
    const response = await createGuideItemRoute(
      jsonRequest("http://test/api/guide-data/nope", "POST", { marketId: "market_id", text: "x" }),
      params({ resource: "nope" }),
    );
    expect(response.status).toBe(404);
  });

  it("validates the payload", async () => {
    const guide = await marketGuide("ID");
    const response = await createGuideItemRoute(
      jsonRequest("http://test/api/guide-data/checklist", "POST", {
        marketId: guide.market.id,
        text: "   ",
      }),
      params({ resource: "checklist" }),
    );
    expect(response.status).toBe(422);
  });
});