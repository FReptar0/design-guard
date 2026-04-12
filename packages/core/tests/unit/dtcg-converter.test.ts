import { describe, it, expect } from 'vitest';
import {
  designMdToDTCG,
  dtcgToDesignMd,
  dtcgToCSS,
  dtcgToFlatJSON,
  extractColorTokens,
  extractTypographyTokens,
  extractSpacingTokens,
} from '../../src/tokens/dtcg-converter.js';
import type { DTCGFile, DTCGToken } from '../../src/tokens/dtcg-converter.js';

// ─── Sample DESIGN.md ──────────────────────────────────────────────

const SAMPLE_DESIGN_MD = `# TestBrand — Design System

## 1. Visual Theme & Atmosphere

A bold, modern design language for TestBrand.

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Trust Navy | #0F2B5B | Main brand color, CTAs |
| Secondary | Signal Blue | #2563EB | Supporting elements |
| Accent | Coral | #F97066 | Highlights, notifications |
| Surface | Pearl | #F8F6F0 | Background, cards |
| On-Surface | Charcoal | #2B2B2B | Body text on surface |
| Error | Signal Red | #DC2626 | Error states |
| Success | Verified Green | #16A34A | Success states |
| Muted | Oyster | #E5E0D8 | Disabled states |

## 3. Typography

- **Heading**: "Space Grotesk", sans-serif
- **Body**: "Libre Franklin", sans-serif
- **Mono**: "JetBrains Mono", monospace

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.75rem | 700 | 1.15 |
| H2 | 2rem | 700 | 1.2 |
| H3 | 1.375rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small | 0.875rem | 400 | 1.5 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Max content width**: 1200px
- **Grid**: 12-column, 20px gutter
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Section vertical padding**: 64px desktop, 40px mobile

## 5. Component Patterns

### Buttons
- Primary: filled, 6px radius

### Cards
- Surface background, 8px radius

### Inputs
- 1px border, 4px radius
`;

describe('DTCG converter', () => {
  describe('designMdToDTCG', () => {
    it('extracts correct color tokens from a complete DESIGN.md', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);

      expect(result.color).toBeDefined();
      expect(result.$description).toBe('Design tokens extracted from DESIGN.md');

      const primary = result.color!['primary'] as DTCGToken;
      expect(primary).toBeDefined();
      expect(primary.$value).toBe('#0F2B5B');
      expect(primary.$type).toBe('color');

      const secondary = result.color!['secondary'] as DTCGToken;
      expect(secondary.$value).toBe('#2563EB');

      const accent = result.color!['accent'] as DTCGToken;
      expect(accent.$value).toBe('#F97066');
    });

    it('extracts all 8 color roles', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);
      const colorKeys = Object.keys(result.color!).filter(k => !k.startsWith('$'));
      expect(colorKeys).toHaveLength(8);
      expect(colorKeys).toContain('primary');
      expect(colorKeys).toContain('error');
      expect(colorKeys).toContain('success');
      expect(colorKeys).toContain('muted');
    });

    it('extracts typography tokens with font families', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);

      expect(result.typography).toBeDefined();
      const headingFont = result.typography!['fontFamily-heading'] as DTCGToken;
      expect(headingFont).toBeDefined();
      expect(headingFont.$value).toBe('"Space Grotesk", sans-serif');
      expect(headingFont.$type).toBe('fontFamily');

      const bodyFont = result.typography!['fontFamily-body'] as DTCGToken;
      expect(bodyFont.$value).toBe('"Libre Franklin", sans-serif');
    });

    it('extracts typography size table as composite tokens', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);

      const sizes = result.typography!['sizes'] as Record<string, DTCGToken>;
      expect(sizes).toBeDefined();

      const h1 = sizes['h1'] as DTCGToken;
      expect(h1).toBeDefined();
      expect(h1.$type).toBe('typography');
      const h1Value = h1.$value as Record<string, unknown>;
      expect(h1Value.fontSize).toBe('2.75rem');
      expect(h1Value.fontWeight).toBe(700);
      expect(h1Value.lineHeight).toBe(1.15);
    });

    it('extracts spacing tokens with base unit and scale', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);

      expect(result.spacing).toBeDefined();
      const baseUnit = result.spacing!['base-unit'] as DTCGToken;
      expect(baseUnit).toBeDefined();
      expect(baseUnit.$value).toBe('4px');
      expect(baseUnit.$type).toBe('dimension');
    });

    it('extracts spacing scale values', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);
      const scale1 = result.spacing!['scale-1'] as DTCGToken;
      expect(scale1.$value).toBe('4px');
      const scale9 = result.spacing!['scale-9'] as DTCGToken;
      expect(scale9.$value).toBe('96px');
    });

    it('extracts breakpoints', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);
      const bpSm = result.spacing!['breakpoint-sm'] as DTCGToken;
      expect(bpSm).toBeDefined();
      expect(bpSm.$value).toBe('640px');
      const bpXl = result.spacing!['breakpoint-xl'] as DTCGToken;
      expect(bpXl.$value).toBe('1280px');
    });

    it('extracts max content width', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);
      const maxWidth = result.spacing!['max-width'] as DTCGToken;
      expect(maxWidth).toBeDefined();
      expect(maxWidth.$value).toBe('1200px');
    });

    it('DTCG output follows W3C spec structure with $value and $type', () => {
      const result = designMdToDTCG(SAMPLE_DESIGN_MD);

      // Every color token must have $value and $type
      for (const [key, token] of Object.entries(result.color!)) {
        if (key.startsWith('$')) continue;
        const t = token as DTCGToken;
        expect(t).toHaveProperty('$value');
        expect(t).toHaveProperty('$type');
        expect(typeof t.$value).toBe('string');
      }

      // Every spacing token must have $value and $type
      for (const [key, token] of Object.entries(result.spacing!)) {
        if (key.startsWith('$')) continue;
        const t = token as DTCGToken;
        expect(t).toHaveProperty('$value');
        expect(t.$type).toBe('dimension');
      }
    });
  });

  describe('handles edge cases', () => {
    it('handles missing sections gracefully', () => {
      const minimal = `# Minimal Design

## 1. Visual Theme

Just a theme description.
`;
      const result = designMdToDTCG(minimal);
      expect(result.color).toBeDefined();
      expect(Object.keys(result.color!)).toHaveLength(0);
      expect(result.typography).toBeDefined();
      expect(result.spacing).toBeDefined();
    });

    it('handles malformed hex values by not extracting them', () => {
      const bad = `# Bad Design

## 2. Color Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Bad | NOTHEX | Not a color |
`;
      const result = designMdToDTCG(bad);
      const colorKeys = Object.keys(result.color!).filter(k => !k.startsWith('$'));
      expect(colorKeys).toHaveLength(0);
    });

    it('handles empty DESIGN.md', () => {
      const result = designMdToDTCG('');
      expect(result.$description).toBeDefined();
      expect(result.color).toBeDefined();
    });
  });

  describe('round-trip conversion', () => {
    it('DESIGN.md to DTCG to DESIGN.md preserves color values', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const regenerated = dtcgToDesignMd(tokens);

      // All hex values from original should appear in regenerated
      expect(regenerated).toContain('#0F2B5B');
      expect(regenerated).toContain('#2563EB');
      expect(regenerated).toContain('#F97066');
      expect(regenerated).toContain('#DC2626');
    });

    it('DESIGN.md to DTCG to DESIGN.md preserves spacing values', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const regenerated = dtcgToDesignMd(tokens);

      expect(regenerated).toContain('4px');
      expect(regenerated).toContain('1200px');
    });

    it('DESIGN.md to DTCG to DESIGN.md preserves font families', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const regenerated = dtcgToDesignMd(tokens);

      expect(regenerated).toContain('"Space Grotesk"');
      expect(regenerated).toContain('"Libre Franklin"');
    });
  });

  describe('dtcgToCSS', () => {
    it('produces valid CSS custom properties', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const css = dtcgToCSS(tokens);

      expect(css).toContain(':root {');
      expect(css).toContain('}');
      expect(css).toContain('--color-primary: #0F2B5B;');
      expect(css).toContain('--color-secondary: #2563EB;');
      expect(css).toContain('--spacing-base-unit: 4px;');
    });

    it('includes typography variables', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const css = dtcgToCSS(tokens);

      expect(css).toContain('--typography-fontFamily-heading');
      expect(css).toContain('"Space Grotesk"');
    });
  });

  describe('dtcgToFlatJSON', () => {
    it('produces flat key-value pairs', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const flat = dtcgToFlatJSON(tokens);

      expect(flat['color.primary']).toBe('#0F2B5B');
      expect(flat['color.secondary']).toBe('#2563EB');
      expect(flat['spacing.base-unit']).toBe('4px');
      expect(flat['spacing.max-width']).toBe('1200px');
    });

    it('nests typography sizes correctly', () => {
      const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
      const flat = dtcgToFlatJSON(tokens);

      expect(flat['typography.fontFamily-heading']).toBe('"Space Grotesk", sans-serif');
      // Composite typography values are JSON-stringified
      expect(typeof flat['typography.sizes.h1']).toBe('string');
      const h1 = JSON.parse(flat['typography.sizes.h1'] as string);
      expect(h1.fontSize).toBe('2.75rem');
    });
  });

  describe('individual extractors', () => {
    it('extractColorTokens handles table with varying spacing', () => {
      const section = `## 2. Color Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
|Primary|Trust Navy|#0F2B5B|CTAs|
| Secondary |  Blue  |  #2563EB  |  Accents  |
`;
      const colors = extractColorTokens(section);
      expect((colors['primary'] as DTCGToken).$value).toBe('#0F2B5B');
      expect((colors['secondary'] as DTCGToken).$value).toBe('#2563EB');
    });

    it('extractTypographyTokens handles font entries', () => {
      const section = `## 3. Typography

- **Heading**: "DM Serif Display", serif
- **Body**: "Source Sans 3", sans-serif

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3rem | 700 | 1.1 |
`;
      const typo = extractTypographyTokens(section);
      expect((typo['fontFamily-heading'] as DTCGToken).$value).toBe('"DM Serif Display", serif');
      const sizes = typo['sizes'] as Record<string, DTCGToken>;
      expect(sizes['h1'].$type).toBe('typography');
    });

    it('extractSpacingTokens handles various formats', () => {
      const section = `## 4. Spacing & Layout

- **Base unit**: 8px
- **Scale**: 8, 16, 24, 32
- **Max content width**: 960px
- **Breakpoints**: 480px (xs), 768px (md)
`;
      const spacing = extractSpacingTokens(section);
      expect((spacing['base-unit'] as DTCGToken).$value).toBe('8px');
      expect((spacing['max-width'] as DTCGToken).$value).toBe('960px');
      expect((spacing['breakpoint-xs'] as DTCGToken).$value).toBe('480px');
      expect((spacing['breakpoint-md'] as DTCGToken).$value).toBe('768px');
    });
  });
});
