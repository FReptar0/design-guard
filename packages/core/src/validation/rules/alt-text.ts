import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Checks for missing img alt attributes.
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
    if (imgsWithoutAlt > 0) {
      issues.push({
        type: 'error',
        category: 'accessibility',
        message: `${imgsWithoutAlt} image(s) missing alt attribute.`,
      });
    }

    return issues;
  },
};
