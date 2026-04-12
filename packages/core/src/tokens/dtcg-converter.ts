/**
 * DTCG Token Converter
 *
 * Converts between DESIGN.md format and the W3C DTCG (Design Tokens Community Group)
 * format. The DTCG spec (2025.10) defines tokens as { $value, $type, $description }.
 *
 * See: https://tr.designtokens.org/format/
 */

// ─── DTCG types ────────────────────────────────────────────────────

export interface DTCGToken {
  $value: string | number | Record<string, unknown>;
  $type?: string;
  $description?: string;
}

export interface DTCGTokenGroup {
  [key: string]: DTCGToken | DTCGTokenGroup | string | undefined;
  $description?: string;
}

export interface DTCGFile {
  $description?: string;
  color?: DTCGTokenGroup;
  typography?: DTCGTokenGroup;
  spacing?: DTCGTokenGroup;
  [key: string]: DTCGTokenGroup | string | undefined;
}

// ─── DESIGN.md → DTCG ─────────────────────────────────────────────

/**
 * Convert a DESIGN.md string to DTCG token format.
 *
 * Extracts:
 * - Color palette (Section 2) → color tokens
 * - Typography (Section 3) → typography tokens
 * - Spacing (Section 4) → dimension tokens
 */
export function designMdToDTCG(designMd: string): DTCGFile {
  const tokens: DTCGFile = {
    $description: 'Design tokens extracted from DESIGN.md',
  };

  tokens.color = extractColorTokens(designMd);
  tokens.typography = extractTypographyTokens(designMd);
  tokens.spacing = extractSpacingTokens(designMd);

  return tokens;
}

// ─── DTCG → DESIGN.md ─────────────────────────────────────────────

/**
 * Convert DTCG tokens back to DESIGN.md format sections.
 * This allows importing design tokens from Figma/Tokens Studio into DESIGN.md.
 */
export function dtcgToDesignMd(tokens: DTCGFile): string {
  const sections: string[] = [];

  if (tokens.color && Object.keys(tokens.color).some(k => !k.startsWith('$'))) {
    sections.push(generateColorSection(tokens.color));
  }
  if (tokens.typography && Object.keys(tokens.typography).some(k => !k.startsWith('$'))) {
    sections.push(generateTypographySection(tokens.typography));
  }
  if (tokens.spacing && Object.keys(tokens.spacing).some(k => !k.startsWith('$'))) {
    sections.push(generateSpacingSection(tokens.spacing));
  }

  return sections.join('\n\n');
}

// ─── Format converters ─────────────────────────────────────────────

/**
 * Convert DTCG tokens to CSS custom properties.
 */
export function dtcgToCSS(tokens: DTCGFile): string {
  const lines: string[] = [':root {'];

  if (tokens.color) {
    lines.push('  /* Colors */');
    for (const [key, token] of Object.entries(tokens.color)) {
      if (key.startsWith('$')) continue;
      if (isToken(token)) {
        lines.push(`  --color-${key}: ${token.$value};`);
      }
    }
  }

  if (tokens.typography) {
    lines.push('  /* Typography */');
    for (const [key, token] of Object.entries(tokens.typography)) {
      if (key.startsWith('$')) continue;
      if (isToken(token)) {
        // Simple value (font-family etc.)
        lines.push(`  --typography-${key}: ${token.$value};`);
      } else if (isTokenGroup(token)) {
        // Composite: heading sizes, body sizes, etc.
        for (const [subKey, subToken] of Object.entries(token)) {
          if (subKey.startsWith('$')) continue;
          if (isToken(subToken)) {
            lines.push(`  --typography-${key}-${subKey}: ${typeof subToken.$value === 'object' ? JSON.stringify(subToken.$value) : subToken.$value};`);
          }
        }
      }
    }
  }

  if (tokens.spacing) {
    lines.push('  /* Spacing */');
    for (const [key, token] of Object.entries(tokens.spacing)) {
      if (key.startsWith('$')) continue;
      if (isToken(token)) {
        lines.push(`  --spacing-${key}: ${token.$value};`);
      }
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Convert DTCG tokens to flat key-value JSON.
 */
export function dtcgToFlatJSON(tokens: DTCGFile): Record<string, string | number> {
  const flat: Record<string, string | number> = {};

  function flatten(obj: DTCGTokenGroup, prefix: string): void {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$')) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (isToken(value)) {
        flat[path] = typeof value.$value === 'object'
          ? JSON.stringify(value.$value)
          : value.$value as string | number;
      } else if (isTokenGroup(value)) {
        flatten(value, path);
      }
    }
  }

  if (tokens.color) flatten(tokens.color, 'color');
  if (tokens.typography) flatten(tokens.typography, 'typography');
  if (tokens.spacing) flatten(tokens.spacing, 'spacing');

  return flat;
}

// ─── Extraction helpers ────────────────────────────────────────────

function extractSection(markdown: string, sectionNumber: number): string {
  const pattern = new RegExp(
    `## ${sectionNumber}\\..*?\n([\\s\\S]*?)(?=## \\d+\\.|$)`,
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Extract color tokens from Section 2 (Color Palette & Roles).
 * Parses markdown table rows with hex values.
 */
export function extractColorTokens(markdown: string): DTCGTokenGroup {
  const section = extractSection(markdown, 2);
  const group: DTCGTokenGroup = {};

  // Match table rows: | Role | Name | Hex | Usage |
  const rowPattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(#[0-9A-Fa-f]{6}|rgba?\([^)]+\))\s*\|\s*([^|]*)\s*\|/g;
  let match;

  while ((match = rowPattern.exec(section)) !== null) {
    const role = match[1].trim();
    const name = match[2].trim();
    const hex = match[3].trim();
    const usage = match[4].trim();

    // Skip header row
    if (role.toLowerCase() === 'role' || /^-+$/.test(role)) continue;

    const tokenKey = toTokenKey(role);
    group[tokenKey] = {
      $value: hex,
      $type: 'color',
      $description: usage ? `${name} - ${usage}` : name,
    };
  }

  return group;
}

/**
 * Extract typography tokens from Section 3 (Typography).
 * Parses font-family declarations and size table.
 */
export function extractTypographyTokens(markdown: string): DTCGTokenGroup {
  const section = extractSection(markdown, 3);
  const group: DTCGTokenGroup = {};

  // Extract font families: **Heading**: "Font Name", fallback
  const fontFamilyPattern = /\*\*(\w+)\*\*:\s*(.+)/g;
  let match;
  while ((match = fontFamilyPattern.exec(section)) !== null) {
    const role = match[1].trim().toLowerCase();
    const value = match[2].trim();
    group[`fontFamily-${role}`] = {
      $value: value,
      $type: 'fontFamily',
      $description: `${match[1].trim()} font family`,
    };
  }

  // Extract size table: | Element | Size | Weight | Line Height |
  const sizeGroup: DTCGTokenGroup = {};
  const rowPattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(section)) !== null) {
    const element = rowMatch[1].trim();
    const size = rowMatch[2].trim();
    const weight = rowMatch[3].trim();
    const lineHeight = rowMatch[4].trim();

    // Skip header and separator rows
    if (element.toLowerCase() === 'element' || /^-+$/.test(element)) continue;
    if (/^-+$/.test(size)) continue;

    const key = toTokenKey(element);
    sizeGroup[key] = {
      $value: {
        fontSize: size,
        fontWeight: isNaN(Number(weight)) ? weight : Number(weight),
        lineHeight: isNaN(Number(lineHeight)) ? lineHeight : Number(lineHeight),
      },
      $type: 'typography',
      $description: `${element} typography preset`,
    };
  }

  if (Object.keys(sizeGroup).length > 0) {
    group.sizes = sizeGroup;
  }

  return group;
}

/**
 * Extract spacing tokens from Section 4 (Spacing & Layout).
 * Parses base unit, scale, max-width, breakpoints.
 */
export function extractSpacingTokens(markdown: string): DTCGTokenGroup {
  const section = extractSection(markdown, 4);
  const group: DTCGTokenGroup = {};

  // Base unit: **Base unit**: 4px
  const baseMatch = section.match(/base\s*unit[^:]*:\s*(\d+)(px|rem)/i);
  if (baseMatch) {
    group['base-unit'] = {
      $value: `${baseMatch[1]}${baseMatch[2]}`,
      $type: 'dimension',
      $description: 'Base spacing unit',
    };
  }

  // Scale: 4, 8, 12, 16, 24, ...
  const scaleMatch = section.match(/scale[^:]*:\s*([\d,\s]+)/i);
  if (scaleMatch) {
    const unit = baseMatch ? baseMatch[2] : 'px';
    const values = scaleMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    values.forEach((val, idx) => {
      group[`scale-${idx + 1}`] = {
        $value: `${val}${unit}`,
        $type: 'dimension',
        $description: `Spacing scale step ${idx + 1}`,
      };
    });
  }

  // Max content width
  const maxWidthMatch = section.match(/max[- ]?(?:content[- ]?)?width[^:]*:\s*(\d+)(px|rem)/i);
  if (maxWidthMatch) {
    group['max-width'] = {
      $value: `${maxWidthMatch[1]}${maxWidthMatch[2]}`,
      $type: 'dimension',
      $description: 'Maximum content width',
    };
  }

  // Breakpoints
  const breakpointPattern = /(\d+)(px|rem)\s*\((\w+)\)/g;
  let bpMatch;
  while ((bpMatch = breakpointPattern.exec(section)) !== null) {
    const value = `${bpMatch[1]}${bpMatch[2]}`;
    const name = bpMatch[3];
    group[`breakpoint-${name}`] = {
      $value: value,
      $type: 'dimension',
      $description: `Breakpoint ${name}`,
    };
  }

  // Section vertical padding
  const paddingMatch = section.match(/section\s*vertical\s*padding[^:]*:\s*(\d+)(px|rem)/i);
  if (paddingMatch) {
    group['section-padding'] = {
      $value: `${paddingMatch[1]}${paddingMatch[2]}`,
      $type: 'dimension',
      $description: 'Section vertical padding (desktop)',
    };
  }

  return group;
}

// ─── Section generators (DTCG → DESIGN.md) ─────────────────────────

function generateColorSection(colorGroup: DTCGTokenGroup): string {
  const lines: string[] = [];
  lines.push('## 2. Color Palette & Roles');
  lines.push('');
  lines.push('| Role | Name | Hex | Usage |');
  lines.push('|------|------|-----|-------|');

  for (const [key, token] of Object.entries(colorGroup)) {
    if (key.startsWith('$') || !isToken(token)) continue;
    const role = fromTokenKey(key);
    const desc = token.$description || '';
    const parts = desc.split(' - ');
    const name = parts[0] || role;
    const usage = parts[1] || '';
    lines.push(`| ${role} | ${name} | ${token.$value} | ${usage} |`);
  }

  return lines.join('\n');
}

function generateTypographySection(typoGroup: DTCGTokenGroup): string {
  const lines: string[] = [];
  lines.push('## 3. Typography');
  lines.push('');

  // Font families
  for (const [key, token] of Object.entries(typoGroup)) {
    if (key.startsWith('$')) continue;
    if (key.startsWith('fontFamily-') && isToken(token)) {
      const role = key.replace('fontFamily-', '');
      const label = role.charAt(0).toUpperCase() + role.slice(1);
      lines.push(`- **${label}**: ${token.$value}`);
    }
  }

  // Size table
  const sizes = typoGroup.sizes;
  if (sizes && isTokenGroup(sizes)) {
    lines.push('');
    lines.push('| Element | Size | Weight | Line Height |');
    lines.push('|---------|------|--------|-------------|');

    for (const [key, token] of Object.entries(sizes)) {
      if (key.startsWith('$') || !isToken(token)) continue;
      const element = fromTokenKey(key);
      const val = token.$value as Record<string, unknown>;
      lines.push(`| ${element} | ${val.fontSize || ''} | ${val.fontWeight || ''} | ${val.lineHeight || ''} |`);
    }
  }

  return lines.join('\n');
}

function generateSpacingSection(spacingGroup: DTCGTokenGroup): string {
  const lines: string[] = [];
  lines.push('## 4. Spacing & Layout');
  lines.push('');

  // Base unit
  const baseUnit = spacingGroup['base-unit'];
  if (isToken(baseUnit)) {
    lines.push(`- **Base unit**: ${baseUnit.$value}`);
  }

  // Scale
  const scaleTokens: { idx: number; value: string }[] = [];
  for (const [key, token] of Object.entries(spacingGroup)) {
    if (key.startsWith('scale-') && isToken(token)) {
      const idx = parseInt(key.replace('scale-', ''), 10);
      scaleTokens.push({ idx, value: String(token.$value).replace(/px|rem/, '') });
    }
  }
  if (scaleTokens.length > 0) {
    scaleTokens.sort((a, b) => a.idx - b.idx);
    lines.push(`- **Scale**: ${scaleTokens.map(s => s.value).join(', ')}`);
  }

  // Max width
  const maxWidth = spacingGroup['max-width'];
  if (isToken(maxWidth)) {
    lines.push(`- **Max content width**: ${maxWidth.$value}`);
  }

  // Breakpoints
  const breakpoints: { name: string; value: string }[] = [];
  for (const [key, token] of Object.entries(spacingGroup)) {
    if (key.startsWith('breakpoint-') && isToken(token)) {
      breakpoints.push({
        name: key.replace('breakpoint-', ''),
        value: String(token.$value),
      });
    }
  }
  if (breakpoints.length > 0) {
    const bpStr = breakpoints.map(b => `${b.value} (${b.name})`).join(', ');
    lines.push(`- **Breakpoints**: ${bpStr}`);
  }

  // Section padding
  const sectionPadding = spacingGroup['section-padding'];
  if (isToken(sectionPadding)) {
    lines.push(`- **Section vertical padding**: ${sectionPadding.$value} desktop`);
  }

  return lines.join('\n');
}

// ─── Utility helpers ───────────────────────────────────────────────

function toTokenKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function fromTokenKey(key: string): string {
  return key
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

function isToken(value: unknown): value is DTCGToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$value' in value
  );
}

function isTokenGroup(value: unknown): value is DTCGTokenGroup {
  return (
    typeof value === 'object' &&
    value !== null &&
    !('$value' in value)
  );
}
