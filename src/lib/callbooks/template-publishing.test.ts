import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * End-to-end coverage of the starter templates through the real repository:
 * create from template -> validate -> publish -> start a call -> follow a loop.
 * This is the path the application actually takes, not just instantiation.
 */

const tempDirPromise = mkdtemp(path.join(tmpdir(), "leads-master-callbook-templates-"));
process.env.LOCAL_DATABASE_PATH = path.join(await tempDirPromise, "templates.sqlite");

const { createLocalSqliteExecutor, closeLocalDatabase } = await import("@/lib/db/local-sqlite");
const {
  advanceCallSession,
  createCallbook,
  getCallbook,
  goBackInCallSession,
  publishCallbook,
  startCallSession,
} = await import("./repository");
const { findSnapshotNode, sortedNodeBranches } = await import("./session");
const { validateGraph } = await import("./graph");
const { CALLBOOK_TEMPLATES } = await import("./templates");

let tempDir: string;

beforeAll(async () => {
  tempDir = await tempDirPromise;
  await createLocalSqliteExecutor();
});

afterAll(async () => {
  closeLocalDatabase();
  await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function branchIdFor(session: Awaited<ReturnType<typeof startCallSession>>, labelPart: string): string {
  const node = findSnapshotNode(session.snapshot, session.currentNodeId);
  if (!node) throw new Error("The current step is missing from the snapshot.");
  const branch = sortedNodeBranches(node).find((candidate) => candidate.label.includes(labelPart));
  if (!branch) throw new Error(`No response containing "${labelPart}" on "${node.title}".`);
  return branch.id;
}

describe("starter templates through the repository", () => {
  it(
    "creates and publishes every template",
    async () => {
      for (const template of CALLBOOK_TEMPLATES) {
        const callbook = await createCallbook({
          title: template.name,
          primaryGoal: template.primaryGoal,
          templateId: template.id,
        });

        expect(callbook.graph.nodes.length).toBe(template.nodes.length);
        expect(callbook.description.length).toBeGreaterThan(0);
        expect(callbook.targetAudience.length).toBeGreaterThan(0);
        expect(callbook.graph.startNodeId).not.toBeNull();

        const published = await publishCallbook(callbook.id);
        expect(published.version).toBe(1);

        const reopened = await getCallbook(callbook.id);
        expect(reopened?.status).toBe("published");
        expect(reopened?.publishedVersion).toBe(1);
      }
    },
    // Each template is created and published through the database, so the
    // runtime grows with the size of the starter template list.
    30_000,
  );

  it("keeps loops visible as a validation warning", async () => {
    const callbook = await createCallbook({
      title: "Northbay F&B loop check",
      primaryGoal: "book_meeting",
      templateId: "northbay-fnb-no-website-outreach",
    });
    await publishCallbook(callbook.id);

    const reopened = await getCallbook(callbook.id);
    expect(reopened).not.toBeNull();
    const validation = validateGraph(reopened!.graph);
    expect(validation.ok).toBe(true);
    expect(validation.warnings.map((issue) => issue.code)).toContain("cycle_detected");
  });

  it("follows a documented loop back to an earlier step during a call", async () => {
    const callbook = await createCallbook({
      title: "Northbay F&B call",
      primaryGoal: "book_meeting",
      templateId: "northbay-fnb-no-website-outreach",
    });
    await publishCallbook(callbook.id);

    let session = await startCallSession(callbook.id, { prospectName: "Loop test" });
    const openingId = session.currentNodeId;

    async function advance(labelPart: string) {
      session = await advanceCallSession(session.id, { branchId: branchIdFor(session, labelPart) });
    }

    // Walk the authored route until the demo pitch.
    await advance("Mereka pemilik");
    expect(findSnapshotNode(session.snapshot, session.currentNodeId)?.title).toContain(
      "Owner teridentifikasi",
    );

    await advance("Mau mendengar penjelasan");
    await advance("Bertanya bagian mana yang perlu diperbarui");
    await advance("Minta bukti dampak atau hasil");
    await advance("Memahami batasan hasil");

    const pitchId = session.currentNodeId;
    expect(findSnapshotNode(session.snapshot, pitchId)?.title).toContain("Pitch utama");

    // Pitch -> discovery -> pitch: this is the loop the template was written with.
    await advance("Membahas kebutuhan F&B");
    const discoveryId = session.currentNodeId;
    expect(findSnapshotNode(session.snapshot, discoveryId)?.title).toContain("Discovery");

    await advance("Fokus dine-in");
    expect(session.currentNodeId).toBe(pitchId);
    expect(session.path.at(-1)).toBe(pitchId);
    expect(session.path.filter((id) => id === pitchId)).toHaveLength(2);
    expect(session.path[0]).toBe(openingId);

    // Back still walks the recorded route, loop or not.
    session = await goBackInCallSession(session.id);
    expect(session.currentNodeId).toBe(discoveryId);
    expect(session.path.at(-1)).toBe(discoveryId);
  });
});