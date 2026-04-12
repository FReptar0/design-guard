import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects the classic AI hero pattern: centered text, gradient background,
 * heading + paragraph + button.
 */
export const noGenericHero: LintRule = {
  id: 'no-generic-hero',
  name: 'No Generic Hero',
  description: 'Detects the classic AI-generated hero pattern (centered text, gradient, heading + paragraph + button).',
  severity: 'info',
  category: 'slop',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    // Look at first section or header as the hero candidate
    const heroCandidate = $('body > section, body > header, body > div > section, body > div > header').first();
    if (heroCandidate.length === 0) return issues;

    // Check for centered text
    const heroClasses = heroCandidate.attr('class') || '';
    const heroStyle = heroCandidate.attr('style') || '';
    const heroHtml = heroCandidate.html() || '';

    const isCentered =
      /\btext-center\b/.test(heroClasses) ||
      /text-align\s*:\s*center/i.test(heroStyle) ||
      /\btext-center\b/.test(heroHtml) ||
      /text-align\s*:\s*center/i.test(heroHtml);

    // Check for gradient background
    const hasGradient =
      /gradient/i.test(heroStyle) ||
      /\bbg-gradient\b/.test(heroClasses) ||
      /gradient/i.test(heroHtml);

    // Check for heading + paragraph + button (the Holy Trinity)
    const hasHeading = heroCandidate.find('h1, h2').length > 0;
    const hasParagraph = heroCandidate.find('p').length > 0;
    const hasButton = heroCandidate.find('a, button').length > 0;
    const hasHolyTrinity = hasHeading && hasParagraph && hasButton;

    // Flag if all three signals are present
    if (isCentered && hasGradient && hasHolyTrinity) {
      issues.push({
        type: 'info',
        category: 'slop',
        message: 'Generic AI hero detected: centered text + gradient + heading/paragraph/button pattern.',
      });
    }

    return issues;
  },
};
