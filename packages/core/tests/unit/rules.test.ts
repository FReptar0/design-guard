import { describe, it, expect } from 'vitest';
import { load } from 'cheerio';
import { getAllRules, getRule, getRulesByIds } from '../../src/validation/rules/index.js';
import type { LintContext } from '../../src/validation/rules/types.js';

// Helper to build LintContext
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

// --- Rule registry tests ---

describe('rule registry', () => {
  it('getAllRules returns all 18 built-in rules', () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(18);

    const ids = rules.map((r) => r.id);
    expect(ids).toContain('empty-body');
    expect(ids).toContain('no-default-fonts');
    expect(ids).toContain('no-slop-gradients');
    expect(ids).toContain('heading-hierarchy');
    expect(ids).toContain('alt-text');
    expect(ids).toContain('color-adherence');
    expect(ids).toContain('no-icon-grid');
    expect(ids).toContain('business-alignment');
    expect(ids).toContain('no-lorem-ipsum');
    expect(ids).toContain('no-saas-speak');
    expect(ids).toContain('no-duplicate-ctas');
    expect(ids).toContain('no-centered-everything');
    expect(ids).toContain('no-missing-responsive');
    expect(ids).toContain('no-uniform-spacing');
    expect(ids).toContain('no-div-soup');
    expect(ids).toContain('no-missing-meta');
    expect(ids).toContain('no-generic-hero');
    expect(ids).toContain('no-placeholder-images');
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
      expect(rule.category).toMatch(/^(color|typography|accessibility|slop|structure|content|layout)$/);
      expect(typeof rule.check).toBe('function');
    }
  });
});

// --- Individual rule tests ---

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

  it('does not flag Inter when DESIGN.md Section 3 specifies it', () => {
    const rule = getRule('no-default-fonts')!;
    const ctx = buildContext(
      '<html><head><style>body { font-family: Inter, sans-serif; }</style></head><body>Text</body></html>',
      '## 3. Typography\n- **Heading**: "Inter", sans-serif',
    );
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('"Inter" font'))).toBe(false);
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
    expect(issues.some(i => i.message.includes('h1') && i.message.includes('h4'))).toBe(true);
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
    expect(issues.some(i => i.type === 'error')).toBe(true);
    expect(issues.some(i => i.message.includes('2 image(s)'))).toBe(true);
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
    const designMd = '## 2. Color Palette\n| Role | Hex |\n| Primary | #0000FF |\n';
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
    const designMd = '## 2. Color Palette\n| Primary | #0000FF |\n';
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
  it('flags three-icon grid as second section', () => {
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
    expect(issues.some((i) => i.message.includes('Second section'))).toBe(true);
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
    const ctx = buildContext(
      '<html><body><button>Add to Cart</button></body></html>',
      'This is not an e-commerce site.',
    );
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('error');
    expect(issues[0].message).toContain('e-commerce');
  });

  it('returns no issues when business model matches', () => {
    const rule = getRule('business-alignment')!;
    const ctx = buildContext(
      '<html><body><button>Add to Cart</button></body></html>',
      'An e-commerce store for great products.',
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

// --- New slop detection rule tests (Frente B) ---

describe('no-lorem-ipsum rule', () => {
  it('flags lorem ipsum text', () => {
    const rule = getRule('no-lorem-ipsum')!;
    const ctx = buildContext('<html><body><p>Lorem ipsum dolor sit amet</p></body></html>');
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.toLowerCase().includes('lorem ipsum'))).toBe(true);
    expect(issues[0].type).toBe('error');
  });

  it('passes real content', () => {
    const rule = getRule('no-lorem-ipsum')!;
    const ctx = buildContext('<html><body><p>Our company helps businesses grow with real solutions.</p></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-saas-speak rule', () => {
  it('flags "Transform your workflow"', () => {
    const rule = getRule('no-saas-speak')!;
    const ctx = buildContext('<html><body><h1>Transform your workflow</h1></body></html>');
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('Transform your workflow'))).toBe(true);
  });

  it('passes unique marketing copy', () => {
    const rule = getRule('no-saas-speak')!;
    const ctx = buildContext('<html><body><h1>Grow your garden, one seed at a time</h1></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-duplicate-ctas rule', () => {
  it('flags CTA text appearing 3+ times', () => {
    const rule = getRule('no-duplicate-ctas')!;
    const ctx = buildContext(`<html><body>
      <a href="#">Get Started</a>
      <button>Get Started</button>
      <a href="#">Get Started</a>
    </body></html>`);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('get started');
  });

  it('passes with varied CTA text', () => {
    const rule = getRule('no-duplicate-ctas')!;
    const ctx = buildContext(`<html><body>
      <a href="#">Get Started</a>
      <a href="#">Learn More</a>
      <button>Sign Up</button>
    </body></html>`);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-centered-everything rule', () => {
  it('flags pages where most text is centered', () => {
    const rule = getRule('no-centered-everything')!;
    const ctx = buildContext(`<html><body>
      <h1 class="text-center">Title</h1>
      <p class="text-center">Paragraph 1</p>
      <p class="text-center">Paragraph 2</p>
      <p class="text-center">Paragraph 3</p>
      <p class="text-center">Paragraph 4</p>
    </body></html>`);
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('center-aligned'))).toBe(true);
  });

  it('passes with mixed alignment', () => {
    const rule = getRule('no-centered-everything')!;
    const ctx = buildContext(`<html><body>
      <h1 class="text-center">Title</h1>
      <p class="text-left">Left text</p>
      <p>Default text</p>
      <p class="text-right">Right text</p>
      <p>More default</p>
    </body></html>`);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-missing-responsive rule', () => {
  it('flags large pages with no responsive indicators', () => {
    const rule = getRule('no-missing-responsive')!;
    const lines = Array.from({ length: 60 }, (_, i) => `<p>Line ${i}</p>`);
    const html = `<html><head></head><body>\n${lines.join('\n')}\n</body></html>`;
    const ctx = buildContext(html);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('No responsive');
  });

  it('passes with viewport meta', () => {
    const rule = getRule('no-missing-responsive')!;
    const lines = Array.from({ length: 60 }, (_, i) => `<p>Line ${i}</p>`);
    const html = `<html><head><meta name="viewport" content="width=device-width"></head><body>\n${lines.join('\n')}\n</body></html>`;
    const ctx = buildContext(html);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });

  it('passes short pages without responsive', () => {
    const rule = getRule('no-missing-responsive')!;
    const ctx = buildContext('<html><body><p>Short page</p></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-div-soup rule', () => {
  it('flags excessive divs with no semantic elements', () => {
    const rule = getRule('no-div-soup')!;
    const divs = Array.from({ length: 10 }, (_, i) => `<div>Block ${i}</div>`).join('');
    const ctx = buildContext(`<html><body>${divs}</body></html>`);
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('zero semantic'))).toBe(true);
  });

  it('flags missing main element', () => {
    const rule = getRule('no-div-soup')!;
    const ctx = buildContext('<html><body><section><p>Content</p></section></body></html>');
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('<main>'))).toBe(true);
  });
});

describe('no-missing-meta rule', () => {
  it('flags missing lang, viewport, description, and title', () => {
    const rule = getRule('no-missing-meta')!;
    const ctx = buildContext('<html><head></head><body><p>Text</p></body></html>');
    const issues = rule.check(ctx);
    expect(issues.length).toBe(4);
    expect(issues.some((i) => i.message.includes('lang'))).toBe(true);
    expect(issues.some((i) => i.message.includes('viewport'))).toBe(true);
    expect(issues.some((i) => i.message.includes('description'))).toBe(true);
    expect(issues.some((i) => i.message.includes('title'))).toBe(true);
  });

  it('passes with all meta present', () => {
    const rule = getRule('no-missing-meta')!;
    const ctx = buildContext(`<html lang="en"><head>
      <meta name="viewport" content="width=device-width">
      <meta name="description" content="A great page">
      <title>My Page</title>
    </head><body><p>Text</p></body></html>`);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-generic-hero rule', () => {
  it('flags classic AI hero pattern', () => {
    const rule = getRule('no-generic-hero')!;
    const ctx = buildContext(`<html><body>
      <section class="text-center" style="background: linear-gradient(to right, purple, blue);">
        <h1>Welcome to Our Platform</h1>
        <p>The best solution for your needs</p>
        <a href="#">Get Started</a>
      </section>
    </body></html>`);
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('Generic AI hero'))).toBe(true);
  });

  it('passes hero without gradient', () => {
    const rule = getRule('no-generic-hero')!;
    const ctx = buildContext(`<html><body>
      <section class="text-center">
        <h1>Welcome</h1>
        <p>Description</p>
        <a href="#">CTA</a>
      </section>
    </body></html>`);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-placeholder-images rule', () => {
  it('flags placeholder image URLs', () => {
    const rule = getRule('no-placeholder-images')!;
    const ctx = buildContext('<html><body><img src="https://via.placeholder.com/300" alt="test"></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('Placeholder image');
  });

  it('flags images with empty src', () => {
    const rule = getRule('no-placeholder-images')!;
    const ctx = buildContext('<html><body><img src="" alt="test"></body></html>');
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('empty/placeholder'))).toBe(true);
  });

  it('passes real image URLs', () => {
    const rule = getRule('no-placeholder-images')!;
    const ctx = buildContext('<html><body><img src="/images/hero.jpg" alt="Hero"></body></html>');
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});

describe('no-uniform-spacing rule', () => {
  it('flags uniform spacing with no variation', () => {
    const rule = getRule('no-uniform-spacing')!;
    const paddings = Array.from({ length: 15 }, () => '.x { padding: 24px; }').join('\n');
    const html = `<html><head><style>${paddings}</style></head><body><p>Text</p></body></html>`;
    const ctx = buildContext(html);
    const issues = rule.check(ctx);
    expect(issues.some((i) => i.message.includes('24px'))).toBe(true);
  });

  it('passes with varied spacing', () => {
    const rule = getRule('no-uniform-spacing')!;
    const html = `<html><head><style>
      .a { margin: 8px; }
      .b { padding: 16px; }
      .c { margin: 24px; }
      .d { padding: 32px; }
      .e { margin: 12px; }
    </style></head><body><p>Text</p></body></html>`;
    const ctx = buildContext(html);
    const issues = rule.check(ctx);
    expect(issues).toHaveLength(0);
  });
});
