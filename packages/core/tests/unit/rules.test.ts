import { describe, it, expect, vi } from 'vitest';
import { load } from 'cheerio';
import { getAllRules, getRule, getRulesByIds } from '../../src/validation/rules/index.js';
import type { LintContext } from '../../src/validation/rules/types.js';

// ─── Helper to build LintContext ───────────────────────────────────

function buildContext(html: string, designMdContent?: string): LintContext {
  const $ = load(html);
  const allStyles =
    $('style').text() +
    $('[style]')
      .map((_i, el) => $(el).attr('style'))
      .get()
      .join(' ');
  const allClasses = $('[class]')
    .map((_i, el) => $(el).attr('class'))
    .get()
    .join(' ');

  return { html, allStyles, allClasses, $, designMdContent };
}

// ─── Rule registry tests ───────────────────────────────────────────

describe('rule registry', () => {
  it('getAllRules returns all built-in rules', () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(8);

    const ids = rules.map((r) => r.id);
    expect(ids).toContain('empty-body');
    expect(ids).toContain('no-default-fonts');
    expect(ids).toContain('no-slop-gradients');
    expect(ids).toContain('heading-hierarchy');
    expect(ids).toContain('alt-text');
    expect(ids).toContain('color-adherence');
    expect(ids).toContain('no-icon-grid');
    expect(ids).toContain('business-alignment');
  });

  it('getRule returns the correct rule by ID', () => {
    const rule = getRule('alt-text');
    expect(rule).toBeDefined();
    expect(rule!.id).toBe('alt-text');
    expect(rule!.name).toBe('Alt Text');
  });

  it('getRule returns undefined for unknown ID', () => {
    const rule = getRule('nonexistent-rule');
    expect(rule).toBeUndefined();
  });

  it('getRulesByIds filters correctly', () => {
    const rules = getRulesByIds(['alt-text', 'heading-hierarchy']);
    expect(rules).toHaveLength(2);
    expect(rules.map((r) => r.id)).toContain('alt-text');
    expect(rules.map((r) => r.id)).toContain('heading-hierarchy');
  });

  it('getRulesByIds returns empty array for no matches', () => {
    const rules = getRulesByIds(['nonexistent']);
    expect(rules).toHaveLength(0);
  });

  it('each rule has required properties', () => {
    for (const rule of getAllRules()) {
      expect(rule.id).toBeDefined();
      expect(rule.name).toBeDefined();
      expect(rule.description).toBeDefined();
      expect(rule.severity).toMatch(/^(error|warning|info)$/);
      expect(rule.category).toMatch(/^(color|typography|accessibility|slop|structure)$/);
      expect(typeof rule.check).toBe('function');
    }
  });
});

// ─── Individual rule tests ─────────────────────────────────────────

describe('empty-body rule', () => {
  it('flags empty body', () => {
    const rule = getRule('empty-body')!;
    const ctx = buildContext('<html><body></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('error');
    expect(issues[0].message).toContain('empty');
  });

  it('passes body with content', () => {
    const rule = getRule('empty-body')!;
    const ctx = buildContext('<html><body><h1>Hello</h1></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-default-fonts rule', () => {
  it('flags Inter font in CSS', () => {
    const rule = getRule('no-default-fonts')!;
    const ctx = buildContext(
      '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body>Text</body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('Inter'))).toBe(true);
  });

  it('flags Poppins font in CSS', () => {
    const rule = getRule('no-default-fonts')!;
    const ctx = buildContext(
      '<html><head><style>body { font-family: Poppins, sans-serif; }</style></head><body>Text</body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('Poppins'))).toBe(true);
  });

  it('does not flag Inter when DESIGN.md specifies it', () => {
    const rule = getRule('no-default-fonts')!;
    const ctx = buildContext(
      '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body>Text</body></html>',
      '## 3. Typography\n- **Heading**: Inter, sans-serif',
    );
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('Inter'))).toBe(false);
  });

  it('flags Tailwind font-sans class', () => {
    const rule = getRule('no-default-fonts')!;
    const ctx = buildContext(
      '<html><body><div class="font-sans">Text</div></body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('font-sans'))).toBe(true);
  });

  it('returns no issues for custom fonts', () => {
    const rule = getRule('no-default-fonts')!;
    const ctx = buildContext(
      '<html><head><style>body { font-family: "Space Grotesk", sans-serif; }</style></head><body>Text</body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-slop-gradients rule', () => {
  it('flags purple-to-blue gradient', () => {
    const rule = getRule('no-slop-gradients')!;
    const ctx = buildContext(
      '<html><head><style>.bg { background: linear-gradient(purple, blue); }</style></head><body>Text</body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].category).toBe('slop');
  });

  it('returns no issues for other gradients', () => {
    const rule = getRule('no-slop-gradients')!;
    const ctx = buildContext(
      '<html><head><style>.bg { background: linear-gradient(red, orange); }</style></head><body>Text</body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('heading-hierarchy rule', () => {
  it('flags skipped heading levels', () => {
    const rule = getRule('heading-hierarchy')!;
    const ctx = buildContext(
      '<html><body><h1>Title</h1><h4>Skipped</h4></body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('h1');
    expect(issues[0].message).toContain('h4');
  });

  it('passes correct heading order', () => {
    const rule = getRule('heading-hierarchy')!;
    const ctx = buildContext(
      '<html><body><h1>Title</h1><h2>Sub</h2><h3>SubSub</h3></body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });

  it('passes empty heading list', () => {
    const rule = getRule('heading-hierarchy')!;
    const ctx = buildContext('<html><body><p>No headings</p></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('alt-text rule', () => {
  it('flags images without alt', () => {
    const rule = getRule('alt-text')!;
    const ctx = buildContext(
      '<html><body><img src="a.jpg"><img src="b.jpg"></body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('error');
    expect(issues[0].message).toContain('2 image(s)');
  });

  it('passes images with alt', () => {
    const rule = getRule('alt-text')!;
    const ctx = buildContext(
      '<html><body><img src="a.jpg" alt="Photo A"></body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('color-adherence rule', () => {
  it('flags colors not in DESIGN.md palette', () => {
    const rule = getRule('color-adherence')!;
    const designMd = `## 2. Color Palette
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Blue | #0000FF | CTAs |
`;
    const ctx = buildContext(
      '<html><head><style>.a{color:#FF0000}.b{color:#00FF00}.c{color:#FFFF00}.d{color:#FF00FF}</style></head><body>Text</body></html>',
      designMd,
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('4 colors');
  });

  it('returns no issues when colors match palette', () => {
    const rule = getRule('color-adherence')!;
    const designMd = `## 2. Color Palette
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Blue | #0000FF | CTAs |
`;
    const ctx = buildContext(
      '<html><head><style>.a{color:#0000FF}</style></head><body>Text</body></html>',
      designMd,
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });

  it('returns no issues when no DESIGN.md is available', () => {
    const rule = getRule('color-adherence')!;
    const ctx = buildContext(
      '<html><head><style>.a{color:#FF0000}</style></head><body>Text</body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-icon-grid rule', () => {
  it('flags three-column icon grid as second section', () => {
    const rule = getRule('no-icon-grid')!;
    const ctx = buildContext(`
      <html><body>
        <section>Hero</section>
        <section>
          <div class="grid">
            <svg>icon1</svg>
            <svg>icon2</svg>
            <svg>icon3</svg>
          </div>
        </section>
      </body></html>
    `);
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('three-column icon grid'))).toBe(true);
  });

  it('returns no issues for non-icon sections', () => {
    const rule = getRule('no-icon-grid')!;
    const ctx = buildContext(`
      <html><body>
        <section>Hero</section>
        <section><p>Just text</p></section>
      </body></html>
    `);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('business-alignment rule', () => {
  it('flags e-commerce elements on non-e-commerce site', () => {
    const rule = getRule('business-alignment')!;
    const designMd = 'This is not an e-commerce site.';
    const ctx = buildContext(
      '<html><body><button>Add to Cart</button></body></html>',
      designMd,
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('error');
    expect(issues[0].message).toContain('e-commerce');
  });

  it('returns no issues when business model matches', () => {
    const rule = getRule('business-alignment')!;
    const designMd = 'An e-commerce store for great products.';
    const ctx = buildContext(
      '<html><body><button>Add to Cart</button></body></html>',
      designMd,
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });

  it('returns no issues without DESIGN.md', () => {
    const rule = getRule('business-alignment')!;
    const ctx = buildContext(
      '<html><body><button>Add to Cart</button></body></html>',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

// ─── Regression: validateOutput still works ────────────────────────

describe('output validator regression (via rule registry)', () => {
  // Reset module mock to allow this block to import fresh
  vi.mock('node:fs', async () => ({
    existsSync: vi.fn(() => false),
    readFileSync: vi.fn(() => ''),
  }));

  it('validateOutput detects missing alt attributes', async () => {
    const { validateOutput } = await import('../../src/validation/output-validator.js');
    const result = validateOutput('<html><body><img src="test.jpg"></body></html>');
    expect(result.issues.some((i) => i.category === 'accessibility')).toBe(true);
  });

  it('validateOutput detects AI slop fonts', async () => {
    const { validateOutput } = await import('../../src/validation/output-validator.js');
    const result = validateOutput(
      '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body>Text</body></html>',
    );
    expect(result.issues.some((i) => i.category === 'slop' && i.message.includes('Inter'))).toBe(true);
  });

  it('validateOutput passes clean HTML', async () => {
    const { validateOutput } = await import('../../src/validation/output-validator.js');
    const result = validateOutput(
      '<html><head><style>body { font-family: "Space Grotesk", sans-serif; }</style></head>' +
        '<body><h1>Hello</h1><h2>World</h2><img src="test.jpg" alt="Test"></body></html>',
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });
});
