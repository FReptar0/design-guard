import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /lorem\s+ipsum/i,
  /dolor\s+sit\s+amet/i,
  /consectetur\s+adipiscing/i,
  /placeholder\s+text/i,
  /sample\s+text/i,
  /dummy\s+text/i,
];

/**
 * Detects placeholder text that was never replaced with real content.
 */
export const noLoremIpsum: LintRule = {
  id: 'no-lorem-ipsum',
  name: 'No Lorem Ipsum',
  description: 'Detects placeholder text (lorem ipsum, dummy text) indicating unfinished content.',
  severity: 'error',
  category: 'content',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $, html } = context;

    // Check for standard placeholder phrases
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(html)) {
        issues.push({
          type: 'error',
          category: 'content',
          message: `Placeholder text detected: "${html.match(pattern)?.[0]}".`,
        });
      }
    }

    // Check for repeated filler strings like "Text" or "Content" used as placeholders
    const textNodes: string[] = [];
    $('body *')
      .not('script, style, code, pre')
      .each((_i, el) => {
        const directText = $(el)
          .contents()
          .filter(function () {
            return this.type === 'text';
          })
          .text()
          .trim();
        if (directText) {
          textNodes.push(directText);
        }
      });

    const fillerCounts: Record<string, number> = {};
    for (const text of textNodes) {
      const normalized = text.toLowerCase().trim();
      if (normalized === 'text' || normalized === 'content') {
        fillerCounts[normalized] = (fillerCounts[normalized] || 0) + 1;
      }
    }

    for (const [filler, count] of Object.entries(fillerCounts)) {
      if (count >= 3) {
        issues.push({
          type: 'error',
          category: 'content',
          message: `Repeated filler "${filler}" appears ${count} times — likely placeholder content.`,
        });
      }
    }

    return issues;
  },
};
