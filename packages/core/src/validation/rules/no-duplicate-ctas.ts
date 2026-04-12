import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects when the same CTA text appears 3+ times.
 */
export const noDuplicateCtas: LintRule = {
  id: 'no-duplicate-ctas',
  name: 'No Duplicate CTAs',
  description: 'Flags repeated call-to-action text appearing 3 or more times.',
  severity: 'warning',
  category: 'content',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const ctaCounts: Record<string, number> = {};

    $('a, button').each((_i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text) {
        ctaCounts[text] = (ctaCounts[text] || 0) + 1;
      }
    });

    for (const [text, count] of Object.entries(ctaCounts)) {
      if (count >= 3) {
        issues.push({
          type: 'warning',
          category: 'content',
          message: `CTA "${text}" appears ${count} times — consider varying your call-to-action text.`,
        });
      }
    }

    return issues;
  },
};
