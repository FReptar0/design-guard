import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Extracts spacing values from CSS margin/padding declarations and Tailwind classes.
 */
function extractSpacingValues(allStyles: string, allClasses: string): string[] {
  const values: string[] = [];

  // Extract from CSS margin/padding values
  const cssPattern = /(?:margin|padding)(?:-(?:top|right|bottom|left))?\s*:\s*([^;]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = cssPattern.exec(allStyles)) !== null) {
    // Split shorthand values (e.g. "10px 20px 10px 20px")
    const parts = match[1].trim().split(/\s+/);
    for (const part of parts) {
      if (/^\d+(?:px|rem|em)$/.test(part)) {
        values.push(part);
      }
    }
  }

  // Extract from Tailwind spacing classes
  const twPattern = /\b(?:m|p|mx|my|mt|mr|mb|ml|px|py|pt|pr|pb|pl)-(\d+)\b/g;
  while ((match = twPattern.exec(allClasses)) !== null) {
    values.push(`tw-${match[1]}`);
  }

  return values;
}

/**
 * Detects robotic uniform spacing where the same value dominates.
 */
export const noUniformSpacing: LintRule = {
  id: 'no-uniform-spacing',
  name: 'No Uniform Spacing',
  description: 'Flags robotic uniform spacing where the same value appears 10+ times with no variation.',
  severity: 'info',
  category: 'layout',

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, allClasses } = context;

    const spacingValues = extractSpacingValues(allStyles, allClasses);
    if (spacingValues.length === 0) return issues;

    // Count occurrences of each spacing value
    const counts: Record<string, number> = {};
    for (const val of spacingValues) {
      counts[val] = (counts[val] || 0) + 1;
    }

    // Base spacing values that are OK in moderation (16px/1rem = 4 in Tailwind)
    const baseSpacingExceptions = new Set(['4px', '8px', '16px', '0.25rem', '0.5rem', '1rem', 'tw-1', 'tw-2', 'tw-4']);

    // Check how many unique values exist
    const uniqueValues = Object.keys(counts);

    for (const [value, count] of Object.entries(counts)) {
      if (count > 10 && !baseSpacingExceptions.has(value)) {
        // Only flag if there is very low variation (1-2 unique values total)
        if (uniqueValues.length <= 2) {
          issues.push({
            type: 'info',
            category: 'layout',
            message: `Spacing value "${value}" appears ${count} times with almost no variation — creates a robotic feel.`,
          });
        }
      }
    }

    return issues;
  },
};
