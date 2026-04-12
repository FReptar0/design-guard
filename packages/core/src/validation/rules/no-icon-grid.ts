import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects the classic three-column icon grid as second section.
 */
export const noIconGrid: LintRule = {
  id: 'no-icon-grid',
  name: 'No Icon Grid',
  description: 'Detects the ubiquitous three-column icon grid pattern typically placed as the second section.',
  severity: 'info',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const sections = $('section, [class*="section"], main > div').toArray();
    if (sections.length >= 2) {
      const secondSection = $(sections[1]);
      const icons = secondSection.find('svg, [class*="icon"], i[class]');
      const columns = secondSection.find('[class*="col"], [class*="grid"]');
      if (icons.length === 3 && columns.length > 0) {
        issues.push({
          type: 'info',
          category: 'slop',
          message:
            'Second section appears to be a three-column icon grid — very common AI layout pattern.',
        });
      }
    }

    return issues;
  },
};
