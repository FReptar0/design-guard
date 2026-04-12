import { describe, it, expect } from 'vitest';
import { extractTailwindValues } from '../../src/validation/tailwind-parser.js';

describe('tailwind-parser', () => {
  // -------------------------------------------------------------------
  // Color extraction
  // -------------------------------------------------------------------

  describe('arbitrary hex colors', () => {
    it('extracts text-[#RRGGBB] colors', () => {
      const html = '<div class="text-[#FF5733]">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toContain('#FF5733');
    });

    it('extracts bg-[#RRGGBB] colors', () => {
      const html = '<div class="bg-[#1A2B3C]">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toContain('#1A2B3C');
    });

    it('extracts border-[#RRGGBB] colors', () => {
      const html = '<div class="border-[#AABBCC]">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toContain('#AABBCC');
    });

    it('extracts from/to/via gradient colors', () => {
      const html = '<div class="from-[#112233] via-[#445566] to-[#778899]">Gradient</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toContain('#112233');
      expect(result.colors).toContain('#445566');
      expect(result.colors).toContain('#778899');
    });

    it('normalizes 3-char hex to 6-char', () => {
      const html = '<div class="text-[#F00]">Red</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toContain('#FF0000');
    });

    it('deduplicates repeated colors', () => {
      const html = '<div class="text-[#FF0000]"><span class="bg-[#FF0000]">Same</span></div>';
      const result = extractTailwindValues(html);
      expect(result.colors.filter(c => c === '#FF0000')).toHaveLength(1);
    });

    it('returns empty array when no arbitrary colors present', () => {
      const html = '<div class="text-red-500">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toHaveLength(0);
    });

    it('extracts multiple colors from a single class attribute', () => {
      const html = '<div class="text-[#AA0000] bg-[#00BB00] border-[#0000CC]">Multi</div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toHaveLength(3);
    });
  });

  describe('named Tailwind colors', () => {
    it('detects text-red-500', () => {
      const html = '<div class="text-red-500">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.namedColors).toContain('text-red-500');
    });

    it('detects bg-blue-600', () => {
      const html = '<div class="bg-blue-600">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.namedColors).toContain('bg-blue-600');
    });

    it('detects colors with responsive prefixes', () => {
      const html = '<div class="sm:text-green-400">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.namedColors).toContain('text-green-400');
    });

    it('detects special color keywords', () => {
      const html = '<div class="text-white bg-black">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.namedColors).toContain('text-white');
      expect(result.namedColors).toContain('bg-black');
    });
  });

  // -------------------------------------------------------------------
  // Font family extraction
  // -------------------------------------------------------------------

  describe('font families', () => {
    it('extracts font from font-[\'Font Name\']', () => {
      const html = '<div class="font-[\'Space_Grotesk\']">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.fontFamilies).toContain('Space_Grotesk');
    });

    it('extracts font from font-["Font Name"]', () => {
      const html = `<div class='font-["Playfair_Display"]'>Hello</div>`;
      const result = extractTailwindValues(html);
      expect(result.fontFamilies).toContain('Playfair_Display');
    });

    it('detects standard font-sans class', () => {
      const html = '<div class="font-sans">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.fontFamilies).toContain('system-ui, sans-serif');
    });

    it('detects font-serif class', () => {
      const html = '<div class="font-serif">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.fontFamilies).toContain('Georgia, serif');
    });

    it('detects font-mono class', () => {
      const html = '<div class="font-mono">Code</div>';
      const result = extractTailwindValues(html);
      expect(result.fontFamilies).toContain('monospace');
    });
  });

  // -------------------------------------------------------------------
  // Spacing extraction
  // -------------------------------------------------------------------

  describe('spacing', () => {
    it('extracts p-4 padding', () => {
      const html = '<div class="p-4">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.spacing).toContain('p-4');
    });

    it('extracts directional padding', () => {
      const html = '<div class="px-8 py-2">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.spacing).toContain('px-8');
      expect(result.spacing).toContain('py-2');
    });

    it('extracts margin classes', () => {
      const html = '<div class="mt-4 mb-8 mx-auto">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.spacing).toContain('mt-4');
      expect(result.spacing).toContain('mb-8');
      expect(result.spacing).toContain('mx-auto');
    });

    it('extracts gap classes', () => {
      const html = '<div class="gap-6 gap-x-4">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.spacing).toContain('gap-6');
      expect(result.spacing).toContain('gap-x-4');
    });

    it('extracts arbitrary spacing values', () => {
      const html = '<div class="p-[20px] m-[2rem]">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.spacing).toContain('p-[20px]');
      expect(result.spacing).toContain('m-[2rem]');
    });
  });

  // -------------------------------------------------------------------
  // Text alignment
  // -------------------------------------------------------------------

  describe('text alignment', () => {
    it('detects text-center', () => {
      const html = '<div class="text-center">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.textAlignment).toContain('text-center');
    });

    it('detects text-left and text-right', () => {
      const html = '<div class="text-left"><span class="text-right">Hello</span></div>';
      const result = extractTailwindValues(html);
      expect(result.textAlignment).toContain('text-left');
      expect(result.textAlignment).toContain('text-right');
    });

    it('detects text alignment with responsive prefix', () => {
      const html = '<div class="md:text-center">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.textAlignment).toContain('text-center');
    });
  });

  // -------------------------------------------------------------------
  // Responsive prefix detection
  // -------------------------------------------------------------------

  describe('responsive', () => {
    it('detects sm: prefix', () => {
      const html = '<div class="sm:flex">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.responsive).toBe(true);
    });

    it('detects md: prefix', () => {
      const html = '<div class="md:grid-cols-2">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.responsive).toBe(true);
    });

    it('detects lg: prefix', () => {
      const html = '<div class="lg:text-xl">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.responsive).toBe(true);
    });

    it('detects xl: prefix', () => {
      const html = '<div class="xl:max-w-7xl">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.responsive).toBe(true);
    });

    it('detects 2xl: prefix', () => {
      const html = '<div class="2xl:px-0">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.responsive).toBe(true);
    });

    it('returns false when no responsive prefixes', () => {
      const html = '<div class="flex gap-4 p-8">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.responsive).toBe(false);
    });
  });

  // -------------------------------------------------------------------
  // Display classes
  // -------------------------------------------------------------------

  describe('display classes', () => {
    it('detects flex', () => {
      const html = '<div class="flex">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.displayClasses).toContain('flex');
    });

    it('detects grid', () => {
      const html = '<div class="grid">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.displayClasses).toContain('grid');
    });

    it('detects hidden', () => {
      const html = '<div class="hidden">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.displayClasses).toContain('hidden');
    });

    it('detects block and inline-block', () => {
      const html = '<div class="block"><span class="inline-block">Hello</span></div>';
      const result = extractTailwindValues(html);
      expect(result.displayClasses).toContain('block');
      expect(result.displayClasses).toContain('inline-block');
    });

    it('detects display with responsive prefix', () => {
      const html = '<div class="hidden md:flex">Hello</div>';
      const result = extractTailwindValues(html);
      expect(result.displayClasses).toContain('hidden');
      expect(result.displayClasses).toContain('flex');
    });
  });

  // -------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles HTML with no class attributes', () => {
      const html = '<div><p>No classes here</p></div>';
      const result = extractTailwindValues(html);
      expect(result.colors).toHaveLength(0);
      expect(result.fontFamilies).toHaveLength(0);
      expect(result.spacing).toHaveLength(0);
      expect(result.textAlignment).toHaveLength(0);
      expect(result.responsive).toBe(false);
      expect(result.displayClasses).toHaveLength(0);
      expect(result.namedColors).toHaveLength(0);
    });

    it('handles empty HTML', () => {
      const result = extractTailwindValues('');
      expect(result.colors).toHaveLength(0);
      expect(result.responsive).toBe(false);
    });

    it('handles single-quoted class attributes', () => {
      const html = "<div class='text-[#AABB11] flex'>Hello</div>";
      const result = extractTailwindValues(html);
      expect(result.colors).toContain('#AABB11');
      expect(result.displayClasses).toContain('flex');
    });

    it('handles complex real-world Tailwind markup', () => {
      const html = `
        <div class="min-h-screen bg-[#0A0A0A] text-white font-['Inter']">
          <nav class="flex items-center justify-between px-8 py-4">
            <h1 class="text-2xl font-bold">Brand</h1>
          </nav>
          <main class="grid md:grid-cols-2 gap-8 p-[40px]">
            <div class="text-center bg-blue-500 rounded-lg p-6">
              <p class="text-[#F5F5F5]">Card 1</p>
            </div>
            <div class="text-center bg-[#1E293B] rounded-lg p-6">
              <p class="text-gray-300">Card 2</p>
            </div>
          </main>
        </div>
      `;
      const result = extractTailwindValues(html);

      // Colors
      expect(result.colors).toContain('#0A0A0A');
      expect(result.colors).toContain('#F5F5F5');
      expect(result.colors).toContain('#1E293B');

      // Named colors
      expect(result.namedColors).toContain('bg-blue-500');
      expect(result.namedColors).toContain('text-gray-300');

      // Fonts
      expect(result.fontFamilies).toContain('Inter');

      // Spacing
      expect(result.spacing).toContain('px-8');
      expect(result.spacing).toContain('py-4');
      expect(result.spacing).toContain('gap-8');
      expect(result.spacing).toContain('p-6');
      expect(result.spacing).toContain('p-[40px]');

      // Alignment
      expect(result.textAlignment).toContain('text-center');

      // Responsive
      expect(result.responsive).toBe(true);

      // Display
      expect(result.displayClasses).toContain('flex');
      expect(result.displayClasses).toContain('grid');
    });
  });
});
