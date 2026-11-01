import type { CallNodeType, CallbookGoal, CallbookGraph, CallBranch, CallNode, CallStepType } from "../types";
import type { OutcomeKey } from "../outcomes";
import { createId } from "../graph";

/** Template authoring shape: human-readable keys, resolved to ids on instantiation. */
export type TemplateBranch = {
  key: string;
  label: string;
  examples: string[];
  /** Key of the target node, or `null` for an intentionally unconnected example. */
  target: string | null;
};

export type TemplateNode = {
  key: string;
  type: CallNodeType;
  title: string;
  script: string;
  internalNote?: string;
  outcomeKey?: OutcomeKey;
  branches?: TemplateBranch[];
  /** Optional Phase 2 context; templates may omit it. */
  stepType?: CallStepType;
  purpose?: string;
  talkingPoints?: string[];
};

export type CallbookTemplate = {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  primaryGoal: CallbookGoal;
  /** A short note shown while previewing the template's structure. */
  guidance: string;
  startKey: string;
  nodes: TemplateNode[];
  /**
   * Optional Phase 2 context. When present, the create screen pre-selects the
   * market (by code) and the niche (by name) from the existing guide data.
   */
  marketCode?: string;
  nicheName?: string;
};

export type InstantiatedTemplate = {
  title: string;
  description: string;
  targetAudience: string;
  primaryGoal: CallbookGoal;
  graph: CallbookGraph;
};

/**
 * Copies a template into a brand-new graph with freshly generated ids, so editing
 * the copy can never mutate the template definition or another Callbook.
 */
export function instantiateTemplate(template: CallbookTemplate): InstantiatedTemplate {
  const idByKey = new Map<string, string>();
  for (const node of template.nodes) {
    idByKey.set(node.key, createId());
  }

  const positions = layoutPositions(template, idByKey);

  const nodes: CallNode[] = template.nodes.map((node, index) => {
    const id = idByKey.get(node.key);
    if (!id) throw new Error(`Template "${template.id}" is missing an id for "${node.key}".`);

    const branches: CallBranch[] = (node.branches ?? []).map((branch, branchIndex) => {
      const targetId = branch.target ? idByKey.get(branch.target) : null;
      if (branch.target && !targetId) {
        throw new Error(
          `Template "${template.id}" branch "${node.key}/${branch.key}" points at an unknown node.`,
        );
      }
      return {
        id: createId(),
        label: branch.label,
        examplePhrases: [...branch.examples],
        nextNodeId: targetId ?? null,
        sortOrder: branchIndex,
      };
    });

    return {
      id,
      type: node.type,
      title: node.title,
      script: node.script,
      internalNote: node.internalNote ?? null,
      position: positions.get(node.key) ?? { x: 80 + index * 60, y: 120 + index * 40 },
      outcomeKey: node.type === "outcome" ? (node.outcomeKey ?? "other") : null,
      branches,
      sortOrder: index,
      stepType: node.stepType ?? null,
      purpose: node.purpose ?? null,
      talkingPoints: [...(node.talkingPoints ?? [])],
    };
  });

  const startNodeId = idByKey.get(template.startKey) ?? null;
  if (!startNodeId) {
    throw new Error(`Template "${template.id}" has an unknown starting node.`);
  }

  return {
    title: template.name,
    description: template.description,
    targetAudience: template.targetAudience,
    primaryGoal: template.primaryGoal,
    graph: { startNodeId, nodes },
  };
}

/** Breadth-first depth layout so an instantiated template reads left to right. */
function layoutPositions(
  template: CallbookTemplate,
  _idByKey: Map<string, string>,
): Map<string, { x: number; y: number }> {
  const byKey = new Map(template.nodes.map((node) => [node.key, node]));
  const depthByKey = new Map<string, number>();
  const queue: Array<{ key: string; depth: number }> = [{ key: template.startKey, depth: 0 }];

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const current = depthByKey.get(item.key);
    if (current !== undefined && current <= item.depth) continue;
    depthByKey.set(item.key, item.depth);
    const node = byKey.get(item.key);
    for (const branch of node?.branches ?? []) {
      if (branch.target) queue.push({ key: branch.target, depth: item.depth + 1 });
    }
  }

  const rowsByDepth = new Map<number, number>();
  const positions = new Map<string, { x: number; y: number }>();

  for (const node of template.nodes) {
    const depth = depthByKey.get(node.key) ?? 0;
    const row = rowsByDepth.get(depth) ?? 0;
    rowsByDepth.set(depth, row + 1);
    positions.set(node.key, { x: 80 + depth * 340, y: 120 + row * 170 });
  }

  return positions;
}