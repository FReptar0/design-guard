import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects when most content is center-aligned.
 */
export const noCenteredEverything: LintRule = {
  id: 'no-centered-everything',
  name: 'No Centered Everything',
  description: 'Flags pages where over 60% of text-containing elements are center-aligned.',
  severity: 'warning',
  category: 'layout',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $, allStyles } = context;

    // Text-containing elements to check
    const textElements = $('h1, h2, h3, h4, h5, h6, p, li, span, a, button, td, th, label, blockquote');
    const totalTextElements = textElements.length;

    if (totalTextElements === 0) return issues;

    let centeredCount = 0;

    textElements.each((_i, el) => {
      const $el = $(el);

      // Check inline style for text-align: center
      const style = $el.attr('style') || '';
      if (/text-align\s*:\s*center/i.test(style)) {
        centeredCount++;
        return;
      }

      // Check Tailwind text-center class
      const classes = $el.attr('class') || '';
      if (/\btext-center\b/.test(classes)) {
        centeredCount++;
        return;
      }

      // Check if a parent has text-center or text-align: center
      const parents = $el.parents();
      parents.each((_j, parent) => {
        const parentStyle = $(parent).attr('style') || '';
        const parentClasses = $(parent).attr('class') || '';
        if (
          /text-align\s*:\s*center/i.test(parentStyle) ||
          /\btext-center\b/.test(parentClasses)
        ) {
          centeredCount++;
          return false; // break parent loop
        }
      });
    });

    // Also count CSS rules for text-align: center in <style> blocks
    const cssCenter = (allStyles.match(/text-align\s*:\s*center/gi) || []).length;

    const ratio = centeredCount / totalTextElements;
    if (ratio > 0.6) {
      const pct = Math.round(ratio * 100);
      issues.push({
        type: 'warning',
        category: 'layout',
        message: `${pct}% of text elements are center-aligned — creates a monotonous layout.`,
      });
    }

    return issues;
  },
};
