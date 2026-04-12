import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects pages with zero responsive design indicators.
 */
export const noMissingResponsive: LintRule = {
  id: 'no-missing-responsive',
  name: 'No Missing Responsive',
  description: 'Flags pages over 50 lines with no responsive design (media queries, viewport meta, or Tailwind responsive prefixes).',
  severity: 'warning',
  category: 'layout',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { html, allStyles, allClasses, $ } = context;

    // Only check pages over 50 lines
    const lineCount = html.split('\n').length;
    if (lineCount <= 50) return issues;

    const hasMediaQueries = /@media\b/.test(allStyles);
    const hasTailwindResponsive = /\b(sm|md|lg|xl|2xl):/.test(allClasses);
    const hasViewportMeta = $('meta[name="viewport"]').length > 0;

    if (!hasMediaQueries && !hasTailwindResponsive && !hasViewportMeta) {
      issues.push({
        type: 'warning',
        category: 'layout',
        message: 'No responsive design indicators found (no @media queries, no viewport meta, no responsive Tailwind prefixes).',
      });
    }

    return issues;
  },
};
