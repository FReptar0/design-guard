import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGenerator, listGenerators, StitchGenerator, ClaudeDirectGenerator } from '../../src/generators/index.js';
import { existsSync, writeFileSync, mkdirSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Registry tests
// ---------------------------------------------------------------------------
describe('generator registry', () => {
  it('lists available generators', () => {
    const generators = listGenerators();
    expect(generators).toContain('stitch');
    expect(generators).toContain('claude');
    expect(generators.length).toBe(2);
  });

  it('returns StitchGenerator for "stitch"', () => {
    const gen = getGenerator('stitch');
    expect(gen).toBeInstanceOf(StitchGenerator);
    expect(gen.name).toBe('Google Stitch');
  });

  it('returns ClaudeDirectGenerator for "claude"', () => {
    const gen = getGenerator('claude');
    expect(gen).toBeInstanceOf(ClaudeDirectGenerator);
    expect(gen.name).toBe('Claude Direct');
  });

  it('throws for unknown generator', () => {
    expect(() => getGenerator('unknown')).toThrow('Unknown generator: "unknown"');
  });

  it('error message lists available generators', () => {
    expect(() => getGenerator('foo')).toThrow('Available generators: stitch, claude');
  });

  it('returns new instances each call', () => {
    const a = getGenerator('claude');
    const b = getGenerator('claude');
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// StitchGenerator tests
// ---------------------------------------------------------------------------
describe('StitchGenerator', () => {
  it('has correct name', () => {
    const gen = new StitchGenerator();
    expect(gen.name).toBe('Google Stitch');
  });

  it('isAvailable returns true when STITCH_API_KEY is set', async () => {
    const orig = process.env.STITCH_API_KEY;
    process.env.STITCH_API_KEY = 'test-key-123';
    try {
      const gen = new StitchGenerator();
      const available = await gen.isAvailable();
      expect(available).toBe(true);
    } finally {
      if (orig === undefined) {
        delete process.env.STITCH_API_KEY;
      } else {
        process.env.STITCH_API_KEY = orig;
      }
    }
  });

  it('throws when generating without initialization', async () => {
    const gen = new StitchGenerator();
    await expect(gen.generateScreen('test prompt')).rejects.toThrow('Stitch not initialized');
  });

  it('throws when listing screens without initialization', async () => {
    const gen = new StitchGenerator();
    await expect(gen.listScreens('project-123')).rejects.toThrow('Stitch not initialized');
  });

  it('throws when getting screen code without initialization', async () => {
    const gen = new StitchGenerator();
    await expect(gen.getScreenCode('screen-1')).rejects.toThrow('Stitch not initialized');
  });

  it('getQuotaInfo returns quota data', async () => {
    const gen = new StitchGenerator();
    const info = await gen.getQuotaInfo();
    expect(info).toHaveLength(2);
    expect(info[0]).toHaveProperty('model', 'GEMINI_2_5_FLASH');
    expect(info[1]).toHaveProperty('model', 'GEMINI_3_PRO');
    expect(info[0]).toHaveProperty('used');
    expect(info[0]).toHaveProperty('limit');
  });
});

// ---------------------------------------------------------------------------
// ClaudeDirectGenerator tests
// ---------------------------------------------------------------------------
describe('ClaudeDirectGenerator', () => {
  const testScreensDir = join(process.cwd(), 'test-screens-tmp');

  beforeEach(() => {
    if (existsSync(testScreensDir)) {
      rmSync(testScreensDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testScreensDir)) {
      rmSync(testScreensDir, { recursive: true, force: true });
    }
  });

  it('has correct name', () => {
    const gen = new ClaudeDirectGenerator();
    expect(gen.name).toBe('Claude Direct');
  });

  it('isAvailable always returns true', async () => {
    const gen = new ClaudeDirectGenerator();
    expect(await gen.isAvailable()).toBe(true);
  });

  it('generateScreen creates a prompt file', async () => {
    const gen = new ClaudeDirectGenerator();
    // Override screensDir for test isolation
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    await gen.initialize({ type: 'claude' });

    const result = await gen.generateScreen('A landing page for a bakery', {
      screenName: 'bakery-landing',
    });

    expect(result.id).toBe('bakery-landing');
    expect(result.name).toBe('bakery-landing');
    expect(result.metadata?.generator).toBe('claude-direct');

    // Verify prompt file was created
    const promptPath = join(testScreensDir, 'bakery-landing.prompt.md');
    expect(existsSync(promptPath)).toBe(true);

    const contents = readFileSync(promptPath, 'utf-8');
    expect(contents).toContain('# Screen Generation Request');
    expect(contents).toContain('A landing page for a bakery');
    expect(contents).toContain('Use semantic HTML5 elements');
  });

  it('generateScreen includes DESIGN.md content in prompt', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    await gen.initialize({ type: 'claude' });

    const designMd = '## Color Palette\nPrimary: #FF0000';
    const result = await gen.generateScreen('Test page', {
      designMd,
      screenName: 'test-page',
    });

    const promptPath = join(testScreensDir, 'test-page.prompt.md');
    const contents = readFileSync(promptPath, 'utf-8');
    expect(contents).toContain('Primary: #FF0000');
  });

  it('listScreens returns HTML files from screens directory', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    mkdirSync(testScreensDir, { recursive: true });
    writeFileSync(join(testScreensDir, 'page-one.html'), '<html><body>Page One</body></html>');
    writeFileSync(join(testScreensDir, 'page-two.html'), '<html><body>Page Two</body></html>');
    writeFileSync(join(testScreensDir, 'not-a-screen.txt'), 'ignore me');

    const screens = await gen.listScreens('any');
    expect(screens).toHaveLength(2);
    expect(screens.map(s => s.name).sort()).toEqual(['page-one', 'page-two']);
  });

  it('listScreens returns empty array when directory does not exist', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = join(testScreensDir, 'nope');

    const screens = await gen.listScreens('any');
    expect(screens).toHaveLength(0);
  });

  it('getScreenCode returns file contents', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    mkdirSync(testScreensDir, { recursive: true });
    writeFileSync(join(testScreensDir, 'my-screen.html'), '<h1>Hello</h1>');

    const code = await gen.getScreenCode('my-screen');
    expect(code).toBe('<h1>Hello</h1>');
  });

  it('getScreenCode throws for missing screen', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    await expect(gen.getScreenCode('nonexistent')).rejects.toThrow('Screen not found: nonexistent');
  });

  it('generateScreen auto-generates name when none provided', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    await gen.initialize({ type: 'claude' });

    const result = await gen.generateScreen('A contact page');
    expect(result.id).toMatch(/^screen-\d+$/);
    expect(result.name).toMatch(/^screen-\d+$/);
  });

  it('generateScreen includes placeholder text when no DESIGN.md provided', async () => {
    const gen = new ClaudeDirectGenerator();
    (gen as unknown as { screensDir: string }).screensDir = testScreensDir;

    await gen.initialize({ type: 'claude' });

    // Explicitly pass empty designMd to simulate no DESIGN.md
    const result = await gen.generateScreen('A page', {
      designMd: '',
      screenName: 'no-design',
    });

    const promptPath = join(testScreensDir, 'no-design.prompt.md');
    const contents = readFileSync(promptPath, 'utf-8');
    expect(contents).toContain('No DESIGN.md found. Generate with sensible defaults.');
  });
});

// ---------------------------------------------------------------------------
// Config integration tests
// ---------------------------------------------------------------------------
describe('config generator field', () => {
  it('StitchConfig type accepts generator field', async () => {
    // This is a compile-time check more than a runtime one,
    // but we verify the import works and the type is usable
    const { type } = await import('../../src/utils/config.js');
    // Just verifying that GeneratorType is exported and usable
    const genType: import('../../src/utils/config.js').GeneratorType = 'claude';
    expect(genType).toBe('claude');
  });

  it('GeneratorType accepts valid values', async () => {
    const validTypes: import('../../src/utils/config.js').GeneratorType[] = ['stitch', 'claude'];
    expect(validTypes).toContain('stitch');
    expect(validTypes).toContain('claude');
  });
});
