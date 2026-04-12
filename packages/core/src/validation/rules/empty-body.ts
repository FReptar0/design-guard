import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Checks for empty or minimal HTML body.
 */
export const emptyBody: LintRule = {
  id: 'empty-body',
  name: 'Empty Body',
  description: 'Checks that the generated HTML has content in the body element.',
  severity: 'error',
  category: 'structure',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const bodyText = $('body').text().trim();
    if (!bodyText && $('body *').length === 0) {
      issues.push({
        type: 'error',
        category: 'structure',
        message: 'Generated HTML is empty — no content in body.',
      });
    }

    return issues;
  },
};
