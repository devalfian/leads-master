import { describe, expect, it } from "vitest";
import { reachableNodeIds, validateGraph } from "./graph";
import {
  CALLBOOK_TEMPLATES,
  findTemplate,
  instantiateTemplate,
  templateSummary,
} from "./templates";

describe("starter templates", () => {
  it("contains the starter templates in display order", () => {
    expect(CALLBOOK_TEMPLATES.map((template) => template.id)).toEqual([
      "digital-leads-plumbing-au-audit-led-cold-call",
    ]);
  });

  it("uses a unique id for every template", () => {
    const ids = CALLBOOK_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CALLBOOK_TEMPLATES.map((template) => [template.name, template] as const))(
    "%s instantiates into a publishable graph",
    (_name, template) => {
      const instance = instantiateTemplate(template);
      const validation = validateGraph(instance.graph);

      // Loops are allowed (they are reported as warnings), so only errors block a
      // template from being published.
      expect(validation.errors).toEqual([]);
      expect(validation.ok).toBe(true);
      // Nothing in a template may be unreachable: only loop warnings are expected.
      expect(
        validation.warnings.filter((issue) => issue.code !== "cycle_detected"),
      ).toEqual([]);

      expect(instance.graph.startNodeId).not.toBeNull();
      expect(instance.graph.nodes.length).toBe(template.nodes.length);
      // Traversal terminates on the cyclic templates and reaches every node.
      expect(reachableNodeIds(instance.graph).size).toBe(template.nodes.length);
    },
  );

  it.each(CALLBOOK_TEMPLATES.map((template) => [template.name, template] as const))(
    "%s keeps unique authoring keys and resolvable targets",
    (_name, template) => {
      const nodeKeys = template.nodes.map((node) => node.key);
      expect(new Set(nodeKeys).size).toBe(nodeKeys.length);
      expect(nodeKeys).toContain(template.startKey);

      const known = new Set(nodeKeys);
      let outcomeCount = 0;

      for (const node of template.nodes) {
        expect(node.title.trim().length).toBeGreaterThan(0);
        expect(node.script.trim().length).toBeGreaterThan(0);
        if (node.type === "outcome") {
          outcomeCount += 1;
          expect(node.outcomeKey).toBeTruthy();
          expect(node.branches?.length ?? 0).toBe(0);
          continue;
        }

        const branches = node.branches ?? [];
        expect(branches.length).toBeGreaterThan(0);
        const branchKeys = branches.map((branch) => branch.key);
        expect(new Set(branchKeys).size).toBe(branchKeys.length);

        for (const branch of branches) {
          expect(branch.label.trim().length).toBeGreaterThan(0);
          expect(Array.isArray(branch.examples)).toBe(true);
          if (branch.target === null) continue;
          expect(known.has(branch.target)).toBe(true);
          expect(branch.target).not.toBe(node.key);
        }
      }

      expect(outcomeCount).toBeGreaterThan(0);
    },
  );

  it("gives every copy its own identifiers", () => {
    for (const template of CALLBOOK_TEMPLATES) {
      const first = instantiateTemplate(template);
      const second = instantiateTemplate(template);

      const firstIds = new Set(first.graph.nodes.map((node) => node.id));
      for (const node of second.graph.nodes) {
        expect(firstIds.has(node.id)).toBe(false);
      }
      expect(first.graph.startNodeId).not.toBe(second.graph.startNodeId);
    }
  });

  it("does not modify the template when the copy is edited", () => {
    const template = CALLBOOK_TEMPLATES[0]!;
    const originalScript = template.nodes[0]!.script;
    const instance = instantiateTemplate(template);

    instance.graph.nodes[0]!.script = "Changed by the user";
    instance.graph.nodes[0]!.branches[0]!.label = "Changed label";

    expect(template.nodes[0]!.script).toBe(originalScript);
    expect(template.nodes[0]!.branches?.[0]?.label).not.toBe("Changed label");
  });

  it("summarises a template's structure", () => {
    const template = CALLBOOK_TEMPLATES[0]!;
    const summary = templateSummary(template);

    expect(summary.nodeCount).toBe(template.nodes.length);
    expect(summary.outcomeCount).toBeGreaterThan(0);
    expect(summary.branchCount).toBeGreaterThan(0);
    expect(summary.outcomeLabels.length).toBe(summary.outcomeCount);
    expect(summary.startTitle).toBe(
      template.nodes.find((node) => node.key === template.startKey)?.title,
    );
  });

  it("returns null for unknown template ids", () => {
    expect(findTemplate("nope")).toBeNull();
    expect(findTemplate(CALLBOOK_TEMPLATES[0]!.id)).not.toBeNull();
  });
});