/**
 * Rule registry — manages all lint rules.
 *
 * Rules are individually testable, configurable, and extensible.
 */

import type { LintRule } from './types.js';
import { emptyBody } from './empty-body.js';
import { noDefaultFonts } from './no-default-fonts.js';
import { noSlopGradients } from './no-slop-gradients.js';
import { headingHierarchy } from './heading-hierarchy.js';
import { altText } from './alt-text.js';
import { colorAdherence } from './color-adherence.js';
import { noIconGrid } from './no-icon-grid.js';
import { businessAlignment } from './business-alignment.js';

export type { LintRule, LintContext } from './types.js';

/**
 * All built-in rules in execution order.
 */
const ALL_RULES: LintRule[] = [
  emptyBody,
  noDefaultFonts,
  noSlopGradients,
  headingHierarchy,
  altText,
  colorAdherence,
  noIconGrid,
  businessAlignment,
];

/**
 * Get all registered rules.
 */
export function getAllRules(): LintRule[] {
  return [...ALL_RULES];
}

/**
 * Get a single rule by ID.
 */
export function getRule(id: string): LintRule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}

/**
 * Get multiple rules by their IDs.
 */
export function getRulesByIds(ids: string[]): LintRule[] {
  return ALL_RULES.filter((r) => ids.includes(r.id));
}
