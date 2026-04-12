import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Validates h1 -> h2 -> h3 heading order (no skipping levels).
 */
export const headingHierarchy: LintRule = {
  id: 'heading-hierarchy',
  name: 'Heading Hierarchy',
  description: 'Validates that heading levels are not skipped (e.g., h1 followed directly by h4).',
  severity: 'warning',
  category: 'structure',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const headings = $('h1, h2, h3, h4, h5, h6')
      .map((_i, el) => parseInt(el.tagName[1]))
      .get() as number[];

    if (headings.length > 0) {
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i - 1] + 1) {
          issues.push({
            type: 'warning',
            category: 'structure',
            message: `Heading hierarchy skip: h${headings[i - 1]} → h${headings[i]}. Should not skip levels.`,
          });
          break; // Report only the first skip
        }
      }
    }

    return issues;
  },
};
