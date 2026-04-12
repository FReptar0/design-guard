/**
 * Rule registry -- manages all lint rules.
 *
 * Rules are individually testable, configurable, and extensible.
 * 18 total rules: 8 original (with bug fixes) + 10 new slop detection.
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
import { noLoremIpsum } from './no-lorem-ipsum.js';
import { noSaasSpeak } from './no-saas-speak.js';
import { noDuplicateCtas } from './no-duplicate-ctas.js';
import { noCenteredEverything } from './no-centered-everything.js';
import { noMissingResponsive } from './no-missing-responsive.js';
import { noUniformSpacing } from './no-uniform-spacing.js';
import { noDivSoup } from './no-div-soup.js';
import { noMissingMeta } from './no-missing-meta.js';
import { noGenericHero } from './no-generic-hero.js';
import { noPlaceholderImages } from './no-placeholder-images.js';

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
  noLoremIpsum,
  noSaasSpeak,
  noDuplicateCtas,
  noCenteredEverything,
  noMissingResponsive,
  noUniformSpacing,
  noDivSoup,
  noMissingMeta,
  noGenericHero,
  noPlaceholderImages,
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
