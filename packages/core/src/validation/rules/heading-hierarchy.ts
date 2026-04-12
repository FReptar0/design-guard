import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Validates h1 -> h2 -> h3 heading order (no skipping levels).
 * Bug Fix (Frente A): reports ALL skips (not just the first),
 * flags missing h1 and multiple h1 elements.
 */
export const headingHierarchy: LintRule = {
  id: 'heading-hierarchy',
  name: 'Heading Hierarchy',
  description: 'Validates that heading levels are not skipped and that exactly one h1 exists.',
  severity: 'warning',
  category: 'structure',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const headings = $('h1, h2, h3, h4, h5, h6')
      .map((_i, el) => parseInt(el.tagName[1]))
      .get() as number[];

    if (headings.length === 0) return issues;

    const h1Count = headings.filter(h => h === 1).length;

    if (h1Count === 0) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Page has headings but no <h1> element. Every page should have exactly one <h1>.',
      });
    }

    if (h1Count > 1) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `Page has ${h1Count} <h1> elements. There should be exactly one <h1> per page.`,
      });
    }

    // Report ALL heading skips, not just the first one
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] > headings[i - 1] + 1) {
        issues.push({
          type: 'warning',
          category: 'structure',
          message: `Heading hierarchy skip: h${headings[i - 1]} → h${headings[i]}. Should not skip levels.`,
        });
      }
    }

    return issues;
  },
};
