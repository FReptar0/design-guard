export interface DesignBrief {
  companyName: string;
  industry: string;
  targetAudience: string;
  aesthetic: string; // e.g. "minimal luxury", "vibrant tech", "organic warm"
  primaryColor?: string; // hex
  secondaryColor?: string; // hex
}

interface Preset {
  primary: { name: string; hex: string };
  secondary: { name: string; hex: string };
  surface: { name: string; hex: string };
  onSurface: { name: string; hex: string };
  error: { name: string; hex: string };
  success: { name: string; hex: string };
  muted: { name: string; hex: string };
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  iconStyle: string;
  imageryStyle: string;
}

const PRESETS: Record<string, Preset> = {
  bold: {
    primary: { name: 'Deep Navy', hex: '#1B2A4A' },
    secondary: { name: 'Warm Copper', hex: '#C17F59' },
    surface: { name: 'Soft White', hex: '#FAFAF8' },
    onSurface: { name: 'Charcoal', hex: '#2D2D2D' },
    error: { name: 'Brick Red', hex: '#C53030' },
    success: { name: 'Forest Green', hex: '#2F855A' },
    muted: { name: 'Warm Gray', hex: '#E8E6E1' },
    headingFont: '"Space Grotesk", sans-serif',
    bodyFont: '"Libre Franklin", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    iconStyle: 'Lucide icons, 24px default, 2px stroke, solid style',
    imageryStyle: 'Industrial photography with high contrast. 16:9 hero images, 1:1 team photos. Bold angles, machinery, concrete textures.',
  },
  elegant: {
    primary: { name: 'Midnight', hex: '#1A1A2E' },
    secondary: { name: 'Champagne Gold', hex: '#C9A96E' },
    surface: { name: 'Pearl', hex: '#F8F6F0' },
    onSurface: { name: 'Deep Charcoal', hex: '#2B2B2B' },
    error: { name: 'Garnet', hex: '#9B1B30' },
    success: { name: 'Sage', hex: '#5C8A5C' },
    muted: { name: 'Oyster', hex: '#E5E0D8' },
    headingFont: '"DM Serif Display", serif',
    bodyFont: '"Source Sans 3", sans-serif',
    monoFont: '"IBM Plex Mono", monospace',
    iconStyle: 'Lucide icons, 20px default, 1.5px stroke, outline style',
    imageryStyle: 'Editorial photography, muted warm tones. 16:9 hero, 3:4 portraits. Shallow depth of field, natural light.',
  },
  warm: {
    primary: { name: 'Terracotta', hex: '#C4704B' },
    secondary: { name: 'Olive', hex: '#6B7F4E' },
    surface: { name: 'Cream', hex: '#FDF8F0' },
    onSurface: { name: 'Espresso', hex: '#3B2F2F' },
    error: { name: 'Burnt Sienna', hex: '#B7472A' },
    success: { name: 'Moss', hex: '#4A7C59' },
    muted: { name: 'Sand', hex: '#EDE5D8' },
    headingFont: '"Outfit", sans-serif',
    bodyFont: '"Instrument Sans", sans-serif',
    monoFont: '"JetBrains Mono", monospace',
    iconStyle: 'Phosphor icons, 24px default, regular weight, duotone style',
    imageryStyle: 'Warm lifestyle photography with earth tones. 16:9 hero, 4:3 product shots. Natural settings, soft light, organic textures.',
  },
  playful: {
    primary: { name: 'Electric Violet', hex: '#7C3AED' },
    secondary: { name: 'Coral Pop', hex: '#F97066' },
    surface: { name: 'Snow', hex: '#FAFBFC' },
    onSurface: { name: 'Ink', hex: '#1E1E2E' },
    error: { name: 'Hot Pink', hex: '#E11D48' },
    success: { name: 'Lime', hex: '#22C55E' },
    muted: { name: 'Lavender Mist', hex: '#EDE9FE' },
    headingFont: '"Sora", sans-serif',
    bodyFont: '"Nunito Sans", sans-serif',
    monoFont: '"Fira Code", monospace',
    iconStyle: 'Phosphor icons, 24px default, bold weight, filled style',
    imageryStyle: 'Bright, saturated photography or custom illustrations. 1:1 and 16:9 formats. Flat illustration with bold outlines, diverse characters.',
  },
  minimal: {
    primary: { name: 'Graphite', hex: '#374151' },
    secondary: { name: 'Steel Blue', hex: '#4B7C9E' },
    surface: { name: 'White', hex: '#FFFFFF' },
    onSurface: { name: 'Slate', hex: '#334155' },
    error: { name: 'Signal Red', hex: '#DC2626' },
    success: { name: 'Emerald', hex: '#059669' },
    muted: { name: 'Cool Gray', hex: '#F1F5F9' },
    headingFont: '"Instrument Serif", serif',
    bodyFont: '"Geist", sans-serif',
    monoFont: '"Geist Mono", monospace',
    iconStyle: 'Lucide icons, 20px default, 1.5px stroke, outline style',
    imageryStyle: 'Minimal product photography on white/neutral backgrounds. 16:9 hero, 1:1 feature. High negative space, no clutter.',
  },
};

function matchPreset(aesthetic: string): Preset {
  const lower = aesthetic.toLowerCase();
  if (/bold|industrial|strong|powerful|edgy/.test(lower)) return PRESETS.bold;
  if (/elegant|premium|luxury|corporate|formal|sophisticated/.test(lower)) return PRESETS.elegant;
  if (/warm|organic|natural|earthy|cozy|wellness/.test(lower)) return PRESETS.warm;
  if (/playful|vibrant|fun|creative|colorful|energetic/.test(lower)) return PRESETS.playful;
  if (/minimal|clean|simple|understated|quiet/.test(lower)) return PRESETS.minimal;
  return PRESETS.bold; // default
}

export function generateDesignMdTemplate(brief: DesignBrief): string {
  const preset = matchPreset(brief.aesthetic);
  const primary = brief.primaryColor || preset.primary.hex;
  const secondary = brief.secondaryColor || preset.secondary.hex;

  return `# ${brief.companyName} — Design System

## 1. Visual Theme & Atmosphere

${brief.aesthetic} aesthetic for ${brief.industry}. Targeting ${brief.targetAudience}.
<!-- Expand into 2-3 evocative sentences. Name a mood, a reference, a cultural anchor.
     Bad: "A clean and modern look."
     Good: "Inspired by mid-century Swiss graphic design — structured grids,
     bold typography, and restrained color. Feels authoritative but approachable." -->

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | ${preset.primary.name} | ${primary} | Main brand color, CTAs, key UI elements |
| Secondary | ${preset.secondary.name} | ${secondary} | Supporting elements, hover states, accents |
| Surface | ${preset.surface.name} | ${preset.surface.hex} | Background, cards |
| On-Surface | ${preset.onSurface.name} | ${preset.onSurface.hex} | Body text on surface |
| Error | ${preset.error.name} | ${preset.error.hex} | Error states, destructive actions |
| Success | ${preset.success.name} | ${preset.success.hex} | Success states, confirmations |
| Muted | ${preset.muted.name} | ${preset.muted.hex} | Disabled states, subtle backgrounds |

## 3. Typography

- **Heading**: ${preset.headingFont}
- **Body**: ${preset.bodyFont}
- **Mono**: ${preset.monoFont}

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 3rem | 700 | 1.1 |
| H2 | 2.25rem | 700 | 1.2 |
| H3 | 1.5rem | 600 | 1.3 |
| Body | 1rem | 400 | 1.6 |
| Small | 0.875rem | 400 | 1.5 |

## 4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- **Max content width**: 1200px
- **Grid**: 12-column, 24px gutter
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)

## 5. Component Patterns

### Buttons
- Primary: filled with Primary color, white text, 8px radius, 16px 24px padding
- Secondary: outline with Primary color border, Primary text
- Ghost: no background, Primary text, hover shows Muted background

### Cards
- Surface background, 1px border Muted, 12px radius, 24px padding
- Hover: subtle shadow elevation

### Inputs
- 1px border Muted, 8px radius, 12px 16px padding
- Focus: Primary border, subtle Primary shadow
- Error: Error border, Error text below

## 6. Iconography

${preset.iconStyle}

## 7. Imagery Guidelines

${preset.imageryStyle}

## 8. Do's and Don'ts

### Do
- Use consistent spacing from the scale
- Maintain high contrast (4.5:1 minimum) for text readability
- Use Primary color sparingly for emphasis
- Use asymmetric or non-standard layouts for at least one section
- Vary card sizes and spacing to create visual rhythm
- Vary section backgrounds (alternate between light/dark surfaces)

### Don't
- Don't use Inter, Poppins, or system sans-serif as the primary font
- Don't use purple-to-blue gradients anywhere
- Don't use more than 2 font families
- Don't use pure black (#000000) for body text — use On-Surface
- Don't center-align body text longer than 2 lines
- Don't use uniform border-radius (>12px) on all elements
- Don't use standard three-column icon grids as the second page section
- Don't use generic stock illustrations (3D blobs, abstract shapes)
`;
}
