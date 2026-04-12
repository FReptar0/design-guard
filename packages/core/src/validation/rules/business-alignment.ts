import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Validates generated HTML against business model context from DESIGN.md.
 * Bug Fix (Frente A): pricing, login, enterprise, SaaS CTAs detection.
 */
export const businessAlignment: LintRule = {
  id: 'business-alignment',
  name: 'Business Alignment',
  description: 'Validates that generated HTML aligns with the business model described in DESIGN.md.',
  severity: 'error',
  category: 'structure',
  requiresDesign: true,

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { html, designMdContent } = context;

    if (!designMdContent) return issues;

    const designLower = designMdContent.toLowerCase();
    const htmlLower = html.toLowerCase();

    // 7a. If NOT e-commerce, check for cart/checkout in generated HTML
    if (
      designLower.includes('not an e-commerce') ||
      designLower.includes('not e-commerce') ||
      designLower.includes('no online purchasing')
    ) {
      if (
        /\b(add.?to.?cart|shopping.?cart|checkout|buy.?now|carrito)\b/i.test(htmlLower)
      ) {
        issues.push({
          type: 'error',
          category: 'structure',
          message:
            'Generated HTML contains e-commerce elements (cart/checkout) but DESIGN.md specifies this is NOT an e-commerce site.',
        });
      }
    }

    // 7b. If store locator is key, check for location-related elements
    if (
      designLower.includes('store locator') ||
      designLower.includes('find nearest store')
    ) {
      const hasLocationElements =
        /\b(location|store.?finder|find.?store|sucursal|ubicaci|postal|zip.?code|mapa|map)\b/i.test(htmlLower);
      if (!hasLocationElements) {
        issues.push({
          type: 'info',
          category: 'structure',
          message:
            'DESIGN.md specifies store locator as key feature but no location/finder elements detected in output.',
        });
      }
    }

    // 7c. If "free" or "open source", flag pricing/subscription elements
    if (
      designLower.includes('free to use') ||
      designLower.includes('open source') ||
      designLower.includes('open-source') ||
      designLower.includes('mit licensed')
    ) {
      if (
        /\b(pricing|subscription|per.?month|\/mo|\/year|premium.?plan|upgrade.?to.?pro|paid.?tier)\b/i.test(htmlLower)
      ) {
        issues.push({
          type: 'error',
          category: 'structure',
          message:
            'Generated HTML contains pricing/subscription elements but DESIGN.md specifies this is free/open-source software.',
        });
      }
    }

    // 7d. If "no accounts" or "no authentication" or "no signup", flag login/signup forms
    if (
      designLower.includes('no signup') ||
      designLower.includes('no user accounts') ||
      designLower.includes('no login') ||
      designLower.includes('no authentication') ||
      designLower.includes('not a saas')
    ) {
      if (
        /\b(log.?in|sign.?up|sign.?in|create.?account|register|forgot.?password|reset.?password)\b/i.test(htmlLower)
      ) {
        issues.push({
          type: 'error',
          category: 'structure',
          message:
            'Generated HTML contains login/signup elements but DESIGN.md specifies no user accounts or authentication.',
        });
      }
    }

    // 7e. If B2C/open-source, flag enterprise sales CTAs
    if (
      designLower.includes('open source') ||
      designLower.includes('open-source') ||
      designLower.includes('b2c') ||
      designLower.includes('community-driven')
    ) {
      if (
        /\b(contact.?sales|enterprise.?plan|talk.?to.?sales|request.?demo|schedule.?a.?demo|book.?a.?call)\b/i.test(htmlLower)
      ) {
        issues.push({
          type: 'warning',
          category: 'structure',
          message:
            'Generated HTML contains enterprise/sales CTAs but DESIGN.md indicates a B2C or open-source project.',
        });
      }
    }

    // 7f. If NOT a SaaS, flag SaaS-specific CTAs
    if (
      designLower.includes('not a saas') ||
      designLower.includes('not saas') ||
      designLower.includes('open source')
    ) {
      if (
        /\b(start.?free.?trial|launch.?dashboard|go.?to.?dashboard|my.?account|manage.?subscription)\b/i.test(htmlLower)
      ) {
        issues.push({
          type: 'error',
          category: 'structure',
          message:
            'Generated HTML contains SaaS CTAs (trial/dashboard) but DESIGN.md specifies this is NOT a SaaS product.',
        });
      }
    }

    return issues;
  },
};
