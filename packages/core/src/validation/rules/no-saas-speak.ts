import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Blocklist of generic AI marketing phrases.
 * Case-insensitive matching is applied.
 */
const SAAS_SPEAK_PHRASES: string[] = [
  'transform your workflow',
  'seamless integration',
  'revolutionize',
  'unlock the power',
  'take your .+ to the next level',
  'built for teams',
  'trusted by thousands',
  'join \\d+\\+? users',
  'why choose us',
  'our mission',
  'our values',
  'supercharge your',
  'streamline your',
  'empower your',
  'cutting-edge',
  'best-in-class',
  'world-class',
  'game-changing',
  'all-in-one platform',
  'everything you need',
  'start your journey',
  'the future of',
  'designed for the modern',
  'scale with confidence',
];

const SAAS_SPEAK_REGEXES = SAAS_SPEAK_PHRASES.map(
  (phrase) => new RegExp(phrase, 'i'),
);

/**
 * Detects generic AI marketing language (SaaS-speak).
 */
export const noSaasSpeak: LintRule = {
  id: 'no-saas-speak',
  name: 'No SaaS Speak',
  description: 'Detects generic AI marketing language commonly found in AI-generated landing pages.',
  severity: 'warning',
  category: 'content',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    // Extract visible text, excluding code blocks and comments
    const visibleText: string[] = [];
    $('body *')
      .not('script, style, code, pre, noscript')
      .each((_i, el) => {
        const directText = $(el)
          .contents()
          .filter(function () {
            return this.type === 'text';
          })
          .text()
          .trim();
        if (directText) {
          visibleText.push(directText);
        }
      });

    const fullText = visibleText.join(' ');

    for (const regex of SAAS_SPEAK_REGEXES) {
      const match = fullText.match(regex);
      if (match) {
        issues.push({
          type: 'warning',
          category: 'content',
          message: `Generic AI marketing phrase detected: "${match[0]}".`,
        });
      }
    }

    return issues;
  },
};
