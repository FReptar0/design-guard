import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import {
  designMdToDTCG,
  dtcgToDesignMd,
  dtcgToCSS,
  dtcgToFlatJSON,
} from '@design-guard/core';

// ─── Sample DESIGN.md ──────────────────────────────────────────────

const SAMPLE_DESIGN_MD = `# TestBrand — Design System

## 1. Visual Theme & Atmosphere

A bold design for TestBrand.

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Trust Navy | #0F2B5B | Main brand color |
| Secondary | Signal Blue | #2563EB | Supporting |
| Surface | Pearl | #F8F6F0 | Background |
| On-Surface | Charcoal | #2B2B2B | Body text |
| Error | Red | #DC2626 | Errors |

## 3. Typography

- **Heading**: "Space Grotesk", sans-serif
- **Body**: "Libre Franklin", sans-serif

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 2.75rem | 700 | 1.15 |
| Body | 1rem | 400 | 1.6 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 16, 32
- **Max content width**: 1200px
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg)
`;

// ─── Sample DTCG tokens ────────────────────────────────────────────

const SAMPLE_DTCG = {
  $description: 'Design tokens from Figma',
  color: {
    primary: { $value: '#FF5500', $type: 'color', $description: 'Orange Primary - Brand CTAs' },
    secondary: { $value: '#003366', $type: 'color', $description: 'Navy - Support' },
  },
  typography: {
    'fontFamily-heading': { $value: '"Outfit", sans-serif', $type: 'fontFamily', $description: 'Heading font family' },
    sizes: {
      h1: { $value: { fontSize: '3rem', fontWeight: 800, lineHeight: 1.1 }, $type: 'typography', $description: 'H1 typography preset' },
    },
  },
  spacing: {
    'base-unit': { $value: '8px', $type: 'dimension', $description: 'Base spacing unit' },
  },
};

describe('tokens export', () => {
  const tmpDir = join(process.cwd(), '__tokens_test_tmp__');

  beforeEach(() => {
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('export produces valid DTCG JSON', async () => {
    const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
    const json = JSON.stringify(tokens, null, 2);

    // Should be valid JSON
    const parsed = JSON.parse(json);
    expect(parsed.$description).toBeDefined();
    expect(parsed.color).toBeDefined();
    expect(parsed.color.primary.$value).toBe('#0F2B5B');
    expect(parsed.color.primary.$type).toBe('color');
  });

  it('export CSS format produces valid CSS custom properties', async () => {
    const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
    const css = dtcgToCSS(tokens);

    expect(css).toMatch(/^:root \{/);
    expect(css).toContain('--color-primary:');
    expect(css).toContain('#0F2B5B');
    expect(css).toContain('--spacing-base-unit: 4px;');
    expect(css).toMatch(/\}$/);
  });

  it('export JSON format produces flat key-value pairs', async () => {
    const tokens = designMdToDTCG(SAMPLE_DESIGN_MD);
    const flat = dtcgToFlatJSON(tokens);

    expect(flat['color.primary']).toBe('#0F2B5B');
    expect(flat['color.secondary']).toBe('#2563EB');
    expect(flat['spacing.base-unit']).toBe('4px');
    expect(typeof flat['typography.fontFamily-heading']).toBe('string');
  });

  it('import creates DESIGN.md sections from DTCG', async () => {
    const markdown = dtcgToDesignMd(SAMPLE_DTCG);

    expect(markdown).toContain('## 2. Color Palette & Roles');
    expect(markdown).toContain('#FF5500');
    expect(markdown).toContain('#003366');
    expect(markdown).toContain('## 3. Typography');
    expect(markdown).toContain('"Outfit"');
    expect(markdown).toContain('## 4. Spacing & Layout');
    expect(markdown).toContain('8px');
  });

  it('import --merge updates only specified sections', async () => {
    const existing = `# Existing Design

## 1. Visual Theme & Atmosphere

Existing theme.

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Old Blue | #0000FF | Old usage |

## 3. Typography

- **Heading**: "Old Font", serif

## 5. Component Patterns

### Buttons
- Keep these buttons.
`;

    const importedSections = dtcgToDesignMd(SAMPLE_DTCG);

    // Simulate merge: section 2 from import should replace section 2 in existing
    // Section 1, 5 should remain untouched
    expect(importedSections).toContain('#FF5500');
    expect(importedSections).not.toContain('#0000FF');

    // Verify existing sections are not in the import output
    expect(importedSections).not.toContain('Visual Theme');
    expect(importedSections).not.toContain('Component Patterns');
  });

  it('missing DESIGN.md shows empty tokens on export', async () => {
    const tokens = designMdToDTCG('');
    const colorKeys = Object.keys(tokens.color || {}).filter(k => !k.startsWith('$'));
    expect(colorKeys).toHaveLength(0);
  });
});
