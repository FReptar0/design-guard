import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Validates generated HTML against business model context from DESIGN.md.
 */
export const businessAlignment: LintRule = {
  id: 'business-alignment',
  name: 'Business Alignment',
  description: 'Validates that generated HTML aligns with the business model described in DESIGN.md.',
  severity: 'error',
  category: 'structure',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { html, designMdContent } = context;

    if (!designMdContent) return issues;

    const designLower = designMdContent.toLowerCase();
    const htmlLower = html.toLowerCase();

    // If NOT e-commerce, check for cart/checkout in generated HTML
    if (
      designLower.includes('not an e-commerce') ||
      designLower.includes('not e-commerce') ||
      designLower.includes('no online purchasing')
    ) {
      if (
        /\b(add.?to.?cart|shopping.?cart|checkout|buy.?now|carrito)\b/i.test(
          htmlLower,
        )
      ) {
        issues.push({
          type: 'error',
          category: 'structure',
          message:
            'Generated HTML contains e-commerce elements (cart/checkout) but DESIGN.md specifies this is NOT an e-commerce site.',
        });
      }
    }

    // If store locator is key, check for location-related elements
    if (
      designLower.includes('store locator') ||
      designLower.includes('find nearest store')
    ) {
      const hasLocationElements =
        /\b(location|store.?finder|find.?store|sucursal|ubicaci|postal|zip.?code|mapa|map)\b/i.test(
          htmlLower,
        );
      if (!hasLocationElements) {
        issues.push({
          type: 'info',
          category: 'structure',
          message:
            'DESIGN.md specifies store locator as key feature but no location/finder elements detected in output.',
        });
      }
    }

    return issues;
  },
};
