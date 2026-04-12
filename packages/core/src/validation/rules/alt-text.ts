import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Checks for missing img alt attributes.
 * Bug Fix (Frente A): detects data-alt without alt (Stitch pattern),
 * separately counts data-alt-only vs fully missing alt.
 */
export const altText: LintRule = {
  id: 'alt-text',
  name: 'Alt Text',
  description: 'Checks that all <img> elements have an alt attribute for accessibility.',
  severity: 'error',
  category: 'accessibility',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const imgsWithoutAlt = $('img:not([alt])').length;
    const imgsWithDataAltOnly = $('img[data-alt]:not([alt])').length;

    if (imgsWithDataAltOnly > 0) {
      issues.push({
        type: 'error',
        category: 'accessibility',
        message: `${imgsWithDataAltOnly} image(s) have data-alt but no alt attribute. Move data-alt value to alt for accessibility.`,
      });
    }

    const imgsWithoutAnyAlt = imgsWithoutAlt - imgsWithDataAltOnly;
    if (imgsWithoutAnyAlt > 0) {
      issues.push({
        type: 'error',
        category: 'accessibility',
        message: `${imgsWithoutAnyAlt} image(s) missing alt attribute.`,
      });
    }

    return issues;
  },
};
