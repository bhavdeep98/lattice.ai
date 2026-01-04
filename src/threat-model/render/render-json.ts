/**
 * JSON threat model renderer
 */

import { ThreatModelDoc } from "../model";

export function renderThreatModelJson(model: ThreatModelDoc): string {
  // Ensure stable output by sorting arrays
  const sortedModel: ThreatModelDoc = {
    ...model,
    inventory: [...model.inventory].sort((a, b) => a.id.localeCompare(b.id)),
    entryPoints: [...model.entryPoints].sort((a, b) => a.id.localeCompare(b.id)),
    dataStores: [...model.dataStores].sort((a, b) => a.id.localeCompare(b.id)),
    boundaries: [...model.boundaries].sort((a, b) => a.id.localeCompare(b.id)),
    flows: [...model.flows].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
    threats: [...model.threats].sort((a, b) => a.id.localeCompare(b.id)),
    checklist: [...model.checklist].sort((a, b) => a.item.localeCompare(b.item)),
    openQuestions: [...model.openQuestions].sort()
  };

  return JSON.stringify(sortedModel, null, 2);
}