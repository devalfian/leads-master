import type { CallbookTemplate } from "./types";
import { digitalLeadsPlumbingColdCallAU } from "./digital-leads-plumbing-cold-call-book-au";

export type { CallbookTemplate, TemplateNode, TemplateBranch } from "./types";
export {
  instantiateTemplate,
  type InstantiatedTemplate,
} from "./types";

/**
 * Starter templates in picker order. The Digital Leads Co Australia plumbing book
 * is the only starter: an audit-led cold-call conversation built around a public
 * Google Business Profile + website review, with package routing, objection
 * handling and Australian telemarketing compliance.
 */
export const CALLBOOK_TEMPLATES: readonly CallbookTemplate[] = [
  digitalLeadsPlumbingColdCallAU,
];

export function findTemplate(templateId: string): CallbookTemplate | null {
  return CALLBOOK_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

/** Compact structural summary shown while choosing a template. */
export function templateSummary(template: CallbookTemplate): {
  nodeCount: number;
  outcomeCount: number;
  branchCount: number;
  startTitle: string;
  outcomeLabels: string[];
} {
  const nodes = template.nodes;
  return {
    nodeCount: nodes.length,
    outcomeCount: nodes.filter((node) => node.type === "outcome").length,
    branchCount: nodes.reduce((total, node) => total + (node.branches?.length ?? 0), 0),
    startTitle: nodes.find((node) => node.key === template.startKey)?.title ?? "—",
    outcomeLabels: nodes
      .filter((node) => node.type === "outcome")
      .map((node) => node.title),
  };
}