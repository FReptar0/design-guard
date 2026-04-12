import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

const PLACEHOLDER_SRC_PATTERNS: RegExp[] = [
  /placeholder/i,
  /picsum/i,
  /unsplash\.com\/random/i,
  /via\.placeholder\.com/i,
  /placehold\.it/i,
  /placekitten/i,
  /placebear/i,
];

const STOCK_SRC_PATTERNS: RegExp[] = [
  /\bstock\b/i,
  /shutterstock/i,
  /istockphoto/i,
  /gettyimages/i,
];

/**
 * Detects placeholder and stock image patterns.
 */
export const noPlaceholderImages: LintRule = {
  id: 'no-placeholder-images',
  name: 'No Placeholder Images',
  description: 'Flags placeholder service URLs, stock photo URLs, and images with missing or empty src.',
  severity: 'warning',
  category: 'content',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { $ } = context;

    $('img').each((_i, el) => {
      const src = $(el).attr('src');

      // Check for missing or empty src
      if (src === undefined) {
        issues.push({
          type: 'warning',
          category: 'content',
          message: 'Image with no src attribute.',
        });
        return;
      }

      if (src === '' || src === '#') {
        issues.push({
          type: 'warning',
          category: 'content',
          message: `Image with empty/placeholder src="${src}".`,
        });
        return;
      }

      // Check for placeholder service URLs
      for (const pattern of PLACEHOLDER_SRC_PATTERNS) {
        if (pattern.test(src)) {
          issues.push({
            type: 'warning',
            category: 'content',
            message: `Placeholder image detected: "${src}".`,
          });
          return;
        }
      }

      // Check for stock photo URLs
      for (const pattern of STOCK_SRC_PATTERNS) {
        if (pattern.test(src)) {
          issues.push({
            type: 'warning',
            category: 'content',
            message: `Stock photo URL detected: "${src}".`,
          });
          return;
        }
      }
    });

    return issues;
  },
};
