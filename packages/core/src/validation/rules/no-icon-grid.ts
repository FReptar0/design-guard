import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects the classic icon grid pattern in any section (not just second).
 * Bug Fix (Frente A): 3-6 items, more icon types (img, span, material-symbols, FA),
 * all sections, warning severity instead of info.
 */
export const noIconGrid: LintRule = {
  id: 'no-icon-grid',
  name: 'No Icon Grid',
  description: 'Detects uniform icon grid patterns (3-6 icons) typically used as filler sections.',
  severity: 'warning',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    const sections = $('section, [class*="section"], main > div').toArray();
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = $(sections[sIdx]);
      // Count all icon-like elements: svg, <i> with class, <img> with small/icon-like attrs, <span> with icon classes
      const svgIcons = section.find('svg').length;
      const iIcons = section.find('i[class]').length;
      const imgIcons = section.find('img[width]').filter((_i, el) => {
        const w = parseInt($(el).attr('width') || '0', 10);
        return w > 0 && w <= 64;
      }).length + section.find('img[class*="icon"]').length;
      const spanIcons = section.find(
        'span[class*="material-symbols"], span[class*="material-icons"], ' +
        'span[class*="fa-"], span[class*="lucide-"], span[class*="icon"]',
      ).length;
      const totalIcons = svgIcons + iIcons + imgIcons + spanIcons;

      const columns = section.find('[class*="col"], [class*="grid"]');
      if (totalIcons >= 3 && totalIcons <= 6 && columns.length > 0) {
        const isSecondSection = sIdx === 1;
        issues.push({
          type: 'warning',
          category: 'slop',
          message: isSecondSection
            ? `Second section is a ${totalIcons}-icon grid — classic AI layout pattern. Consider a more distinctive layout.`
            : `Section ${sIdx + 1} contains a uniform ${totalIcons}-icon grid — common AI layout pattern.`,
        });
      }
    }

    return issues;
  },
};
