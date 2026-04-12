import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Detects missing essential meta tags and attributes.
 */
export const noMissingMeta: LintRule = {
  id: 'no-missing-meta',
  name: 'No Missing Meta',
  description: 'Checks for essential meta tags: lang attribute, viewport, description, and title.',
  severity: 'warning',
  category: 'structure',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    // Check for <html lang="...">
    const htmlLang = $('html').attr('lang');
    if (!htmlLang) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing lang attribute on <html> element.',
      });
    }

    // Check for <meta name="viewport">
    if ($('meta[name="viewport"]').length === 0) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing <meta name="viewport"> tag.',
      });
    }

    // Check for <meta name="description">
    if ($('meta[name="description"]').length === 0) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing <meta name="description"> tag.',
      });
    }

    // Check for <title>
    if ($('title').length === 0 || !$('title').text().trim()) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Missing or empty <title> element.',
      });
    }

    return issues;
  },
};
