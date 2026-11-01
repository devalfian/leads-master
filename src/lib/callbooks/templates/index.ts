import type { CallbookTemplate } from "./types";
import { australiaPlumberNoWebsiteOutreach } from "./australia-plumber-no-website";
import { australiaPlumberOutdatedWebsiteOutreach } from "./australia-plumber-outdated-website";
import { northbayFnbNoWebsiteOutreach } from "./northbay-fnb-no-website";
import { northbayFnbOutdatedWebsiteOutreach } from "./northbay-fnb-outdated-website";
import { northbayMotorCarRentalNoWebsiteOutreach } from "./northbay-motor-car-rental-no-website";
import { northbayMotorCarRentalOutdatedWebsiteOutreach } from "./northbay-motor-car-rental-outdated-website";
import { northbayTourTravelNoWebsiteOutreach } from "./northbay-tour-travel-no-website";
import { northbayTourTravelOutdatedWebsiteOutreach } from "./northbay-tour-travel-outdated-website";
import { medSpaCosmeticDentistryOutreach } from "./medspa-cosmetic-dentistry-outreach";
import { proposalFollowUp } from "./proposal-follow-up";

export type { CallbookTemplate, TemplateNode, TemplateBranch } from "./types";
export {
  instantiateTemplate,
  type InstantiatedTemplate,
} from "./types";

/**
 * Starter templates in picker order. The outreach flows are grouped by business
 * type, each with a "no website" and an "outdated website" variant.
 */
export const CALLBOOK_TEMPLATES: readonly CallbookTemplate[] = [
  proposalFollowUp,
  medSpaCosmeticDentistryOutreach,
  northbayFnbNoWebsiteOutreach,
  northbayFnbOutdatedWebsiteOutreach,
  northbayMotorCarRentalNoWebsiteOutreach,
  northbayMotorCarRentalOutdatedWebsiteOutreach,
  northbayTourTravelNoWebsiteOutreach,
  northbayTourTravelOutdatedWebsiteOutreach,
  australiaPlumberNoWebsiteOutreach,
  australiaPlumberOutdatedWebsiteOutreach,
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