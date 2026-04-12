import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Flags Inter, Poppins, and system sans-serif defaults.
 */
export const noDefaultFonts: LintRule = {
  id: 'no-default-fonts',
  name: 'No Default Fonts',
  description: 'Flags common AI-default fonts (Inter, Poppins) unless explicitly specified in DESIGN.md.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, allClasses, designMdContent } = context;

    const isIntentional = (font: string): boolean =>
      designMdContent ? designMdContent.includes(font) : false;

    if (/font-family[^;]*\bInter\b/i.test(allStyles) && !isIntentional('Inter')) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: 'Detected "Inter" font — common AI default. Consider a more distinctive typeface.',
      });
    }

    if (/font-family[^;]*\bPoppins\b/i.test(allStyles) && !isIntentional('Poppins')) {
      issues.push({
        type: 'warning',
        category: 'slop',
        message: 'Detected "Poppins" font — common AI default. Consider a more distinctive typeface.',
      });
    }

    if (/\bfont-sans\b/.test(allClasses) && !isIntentional('Inter')) {
      issues.push({
        type: 'info',
        category: 'slop',
        message: 'Tailwind "font-sans" class detected — resolves to system sans-serif. Consider specifying a custom font.',
      });
    }

    return issues;
  },
};
