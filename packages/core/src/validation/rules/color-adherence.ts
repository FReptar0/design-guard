import type { LintRule, LintContext } from './types.js';
import type { ValidationIssue } from '../output-validator.js';

/**
 * Checks that colors used in the HTML match the DESIGN.md palette.
 * Bug Fix (Frente A): lower threshold (>1 = error, =1 = warning),
 * Tailwind arbitrary values, rgb() parsing, tighter neutral exemption.
 */
export const colorAdherence: LintRule = {
  id: 'color-adherence',
  name: 'Color Adherence',
  description: 'Checks that colors used in the generated output match the DESIGN.md palette.',
  severity: 'warning',
  category: 'color',
  requiresDesign: true,

  check(context: LintContext): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { allStyles, allClasses, designMdContent } = context;

    if (!designMdContent) return issues;

    const designColors = extractDesignColors(designMdContent);
    if (designColors.length === 0) return issues;

    // Extract from CSS styles
    const usedColorsFromStyles = extractUsedColors(allStyles);
    // Extract from Tailwind arbitrary value classes
    const tailwindArbitraryColors = extractTailwindArbitraryColors(allClasses);
    // Extract rgb/rgba from inline styles
    const rgbColors = extractRgbColors(allStyles);

    const allUsedColors = [...new Set([...usedColorsFromStyles, ...tailwindArbitraryColors, ...rgbColors])];
    const unmatchedColors = allUsedColors.filter(c =>
      !designColors.some(dc => dc.toLowerCase() === c.toLowerCase()) &&
      !isNeutralColor(c),
    );

    if (unmatchedColors.length > 1) {
      issues.push({
        type: 'error',
        category: 'color',
        message: `${unmatchedColors.length} colors used that aren't in DESIGN.md palette: ${unmatchedColors.slice(0, 5).join(', ')}. Output deviates from design system.`,
      });
    } else if (unmatchedColors.length === 1) {
      issues.push({
        type: 'warning',
        category: 'color',
        message: `1 color used that isn't in DESIGN.md palette: ${unmatchedColors[0]}. Output may deviate from design system.`,
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

/**
 * Extract hex colors from Tailwind arbitrary value syntax in class attributes.
 * Matches patterns like: text-[#5af9f3], bg-[#aca3ff], border-[#123456]
 */
function extractTailwindArbitraryColors(classes: string): string[] {
  const matches = classes.match(/(?:text|bg|border|ring|shadow|outline|accent|fill|stroke|from|to|via)-\[#([0-9A-Fa-f]{6})\]/g) || [];
  return [...new Set(matches.map(m => {
    const hexMatch = m.match(/#[0-9A-Fa-f]{6}/);
    return hexMatch ? hexMatch[0] : '';
  }).filter(Boolean))];
}

/**
 * Extract hex colors from rgb() and rgba() in style attributes.
 * Converts rgb(R, G, B) to hex for comparison against DESIGN.md palette.
 */
function extractRgbColors(styles: string): string[] {
  const rgbMatches = styles.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g) || [];
  return [...new Set(rgbMatches.map(m => {
    const parts = m.match(/(\d{1,3})/g);
    if (!parts || parts.length < 3) return '';
    const r = Math.min(255, parseInt(parts[0], 10));
    const g = Math.min(255, parseInt(parts[1], 10));
    const b = Math.min(255, parseInt(parts[2], 10));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }).filter(Boolean))];
}

function isNeutralColor(hex: string): boolean {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  if (normalized.length < 7) return false;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  return maxDiff < 10; // Tighter threshold: nearly grayscale (was 20, now 10)
}
