import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags purple-to-blue AI gradients.
 */
export const noSlopGradients: LintRule = {
  id: 'no-slop-gradients',
  name: 'No Slop Gradients',
  description: 'Flags the ubiquitous purple-to-blue gradient pattern common in AI-generated designs.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles } = context;

    if (
      /gradient[^;]*(purple|#[89a-f][0-9a-f]{5})[^;]*(blue|#[0-5][0-9a-f]{5})/i.test(allStyles) ||
      /gradient[^;]*(blue|#[0-5][0-9a-f]{5})[^;]*(purple|#[89a-f][0-9a-f]{5})/i.test(allStyles)
    ) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: 'Detected purple-to-blue gradient — extremely common AI pattern.',
      });
    }

    return issues;
  },
};
