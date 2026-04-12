import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Checks that colors used in the HTML match the DESIGN.md palette.
 */
export const colorAdherence: LintRule = {
  id: 'color-adherence',
  name: 'Color Adherence',
  description: 'Checks that colors used in the generated output match the DESIGN.md palette.',
  severity: 'warning',
  category: 'color',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, designMdContent } = context;

    if (!designMdContent) return issues;

    const designColors = extractDesignColors(designMdContent);
    if (designColors.length === 0) return issues;

    const usedColors = extractUsedColors(allStyles);
    const unmatchedColors = usedColors.filter(
      (c) =>
        !designColors.some((dc) => dc.toLowerCase() === c.toLowerCase()) &&
        !isNeutralColor(c),
    );

    if (unmatchedColors.length > 3) {
      issues.push({
        type: 'warning',
        category: 'color',
        message: `${unmatchedColors.length} colors used that aren't in DESIGN.md palette. Output may deviate from design system.`,
      });
    }

    return issues;
  },
};

function extractDesignColors(content: string): string[] {
  const hexMatches = content.match(/#[0-9A-Fa-f]{6}/g) || [];
  return [...new Set(hexMatches)];
}

function extractUsedColors(styles: string): string[] {
  const hexMatches = styles.match(/#[0-9A-Fa-f]{6}/g) || [];
  return [...new Set(hexMatches)];
}

function isNeutralColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const maxDiff = Math.max(
    Math.abs(r - g),
    Math.abs(g - b),
    Math.abs(r - b),
  );
  return maxDiff < 20;
}
