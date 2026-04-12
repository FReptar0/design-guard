/**
 * Tailwind CSS class parser for design-guard validation.
 *
 * Extracts design values (colors, fonts, spacing, alignment, responsive
 * prefixes, display classes) from Tailwind CSS classes found in HTML markup.
 */

export interface TailwindExtraction {
  /** Hex color values from text-[#xxx], bg-[#xxx], border-[#xxx] arbitrary values */
  colors: string[];
  /** Font families from font-['Font Name'] arbitrary value classes */
  fontFamilies: string[];
  /** Spacing utility classes (p-X, m-X, gap-X, etc.) */
  spacing: string[];
  /** Text alignment classes (text-center, text-left, text-right, text-justify) */
  textAlignment: string[];
  /** Whether any responsive prefixes (sm:, md:, lg:, xl:, 2xl:) are present */
  responsive: boolean;
  /** Display-related classes (flex, grid, block, inline, hidden, etc.) */
  displayClasses: string[];
  /** Named Tailwind color classes like text-red-500, bg-blue-600 */
  namedColors: string[];
}

/**
 * Extract all class attribute values from HTML as a single string.
 */
function extractAllClasses(html: string): string {
  const classRegex = /class\s*=\s*"([^"]*)"/gi;
  const classes: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = classRegex.exec(html)) !== null) {
    classes.push(match[1]);
  }
  // Also handle single-quoted class attributes
  const singleQuoteRegex = /class\s*=\s*'([^']*)'/gi;
  while ((match = singleQuoteRegex.exec(html)) !== null) {
    classes.push(match[1]);
  }
  return classes.join(' ');
}

/**
 * Extract hex colors from Tailwind arbitrary value syntax:
 * text-[#RRGGBB], bg-[#RRGGBB], border-[#RRGGBB], from-[#RRGGBB],
 * to-[#RRGGBB], via-[#RRGGBB], ring-[#RRGGBB], accent-[#RRGGBB],
 * shadow-[#RRGGBB], outline-[#RRGGBB], decoration-[#RRGGBB],
 * divide-[#RRGGBB], placeholder-[#RRGGBB], caret-[#RRGGBB],
 * fill-[#RRGGBB], stroke-[#RRGGBB]
 */
function extractArbitraryColors(classStr: string): string[] {
  const colorPrefixes = [
    'text', 'bg', 'border', 'from', 'to', 'via', 'ring',
    'accent', 'shadow', 'outline', 'decoration', 'divide',
    'placeholder', 'caret', 'fill', 'stroke',
  ];
  const prefixPattern = colorPrefixes.join('|');
  // Match both 3-char and 6-char hex with optional alpha
  const regex = new RegExp(
    `(?:${prefixPattern})-\\[#([0-9A-Fa-f]{3,8})\\]`,
    'g',
  );
  const colors: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(classStr)) !== null) {
    const hex = match[1];
    // Normalize 3-char hex to 6-char
    if (hex.length === 3) {
      colors.push(`#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase());
    } else {
      colors.push(`#${hex.slice(0, 6)}`.toUpperCase());
    }
  }
  return [...new Set(colors)];
}

/**
 * Extract named Tailwind color classes like text-red-500, bg-blue-600.
 * Returns the full class name for reference.
 */
function extractNamedColors(classStr: string): string[] {
  const colorNames = [
    'slate', 'gray', 'zinc', 'neutral', 'stone',
    'red', 'orange', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose',
  ];
  const prefixes = ['text', 'bg', 'border', 'from', 'to', 'via', 'ring', 'accent', 'divide', 'decoration', 'fill', 'stroke'];
  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const results: string[] = [];

  const tokens = classStr.split(/\s+/);
  for (const token of tokens) {
    // Strip responsive/state prefixes like sm:, hover:, etc.
    const baseClass = token.replace(/^(?:[a-z0-9]+:)*/, '');
    for (const prefix of prefixes) {
      for (const color of colorNames) {
        for (const shade of shades) {
          if (baseClass === `${prefix}-${color}-${shade}`) {
            results.push(baseClass);
          }
        }
        // Also match without shade (e.g., text-white, bg-black, text-inherit)
        if (baseClass === `${prefix}-${color}`) {
          results.push(baseClass);
        }
      }
      // Special color keywords
      for (const special of ['white', 'black', 'transparent', 'current', 'inherit']) {
        if (baseClass === `${prefix}-${special}`) {
          results.push(baseClass);
        }
      }
    }
  }
  return [...new Set(results)];
}

/**
 * Extract font families from Tailwind arbitrary font classes: font-['Font Name']
 * and font-["Font Name"].
 */
function extractFontFamilies(classStr: string): string[] {
  const regex = /font-\[['"]([^'"]+)['"]\]/g;
  const fonts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(classStr)) !== null) {
    fonts.push(match[1]);
  }
  // Also detect standard Tailwind font classes
  const standardFonts: Record<string, string> = {
    'font-sans': 'system-ui, sans-serif',
    'font-serif': 'Georgia, serif',
    'font-mono': 'monospace',
  };
  const tokens = classStr.split(/\s+/);
  for (const token of tokens) {
    const baseClass = token.replace(/^(?:[a-z0-9]+:)*/, '');
    if (baseClass in standardFonts) {
      fonts.push(standardFonts[baseClass]);
    }
  }
  return [...new Set(fonts)];
}

/**
 * Extract spacing utility classes: p-X, px-X, py-X, pt-X, pr-X, pb-X, pl-X,
 * m-X, mx-X, my-X, mt-X, mr-X, mb-X, ml-X, gap-X, gap-x-X, gap-y-X,
 * space-x-X, space-y-X, and arbitrary values like p-[20px].
 */
function extractSpacing(classStr: string): string[] {
  const spacingPrefixes = [
    'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
    'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
    'gap', 'gap-x', 'gap-y', 'space-x', 'space-y',
  ];
  const results: string[] = [];
  const tokens = classStr.split(/\s+/);
  for (const token of tokens) {
    // Strip responsive/state prefixes
    const baseClass = token.replace(/^(?:[a-z0-9]+:)*/, '');
    for (const prefix of spacingPrefixes) {
      // Match: prefix-N, prefix-N.N, prefix-auto, prefix-[Npx], prefix-[Nrem], etc.
      const pattern = new RegExp(`^${prefix.replace('-', '\\-')}-(?:\\d+(?:\\.\\d+)?|auto|\\[.+\\])$`);
      if (pattern.test(baseClass)) {
        results.push(baseClass);
        break;
      }
    }
  }
  return [...new Set(results)];
}

/**
 * Extract text alignment classes.
 */
function extractTextAlignment(classStr: string): string[] {
  const alignments = ['text-center', 'text-left', 'text-right', 'text-justify', 'text-start', 'text-end'];
  const results: string[] = [];
  const tokens = classStr.split(/\s+/);
  for (const token of tokens) {
    const baseClass = token.replace(/^(?:[a-z0-9]+:)*/, '');
    if (alignments.includes(baseClass)) {
      results.push(baseClass);
    }
  }
  return [...new Set(results)];
}

/**
 * Check for responsive prefixes: sm:, md:, lg:, xl:, 2xl:
 */
function hasResponsivePrefixes(classStr: string): boolean {
  return /\b(?:sm|md|lg|xl|2xl):/.test(classStr);
}

/**
 * Extract display-related classes.
 */
function extractDisplayClasses(classStr: string): string[] {
  const displayValues = [
    'flex', 'inline-flex', 'grid', 'inline-grid',
    'block', 'inline-block', 'inline', 'hidden',
    'table', 'table-row', 'table-cell',
    'contents', 'flow-root', 'list-item',
  ];
  const results: string[] = [];
  const tokens = classStr.split(/\s+/);
  for (const token of tokens) {
    const baseClass = token.replace(/^(?:[a-z0-9]+:)*/, '');
    if (displayValues.includes(baseClass)) {
      results.push(baseClass);
    }
  }
  return [...new Set(results)];
}

/**
 * Extract design values from Tailwind CSS classes in HTML.
 *
 * Parses all class attributes in the HTML and identifies:
 * - Arbitrary hex colors (text-[#RRGGBB], bg-[#RRGGBB], etc.)
 * - Named Tailwind colors (text-red-500, bg-blue-600, etc.)
 * - Font families (font-['Font Name'] and font-sans/serif/mono)
 * - Spacing utilities (p-4, mx-8, gap-6, etc.)
 * - Text alignment (text-center, text-left, etc.)
 * - Responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
 * - Display classes (flex, grid, block, hidden, etc.)
 */
export function extractTailwindValues(html: string): TailwindExtraction {
  const allClasses = extractAllClasses(html);

  return {
    colors: extractArbitraryColors(allClasses),
    fontFamilies: extractFontFamilies(allClasses),
    spacing: extractSpacing(allClasses),
    textAlignment: extractTextAlignment(allClasses),
    responsive: hasResponsivePrefixes(allClasses),
    displayClasses: extractDisplayClasses(allClasses),
    namedColors: extractNamedColors(allClasses),
  };
}
