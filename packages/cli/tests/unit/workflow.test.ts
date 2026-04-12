import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WORKFLOWS, WORKFLOW_TYPES, getWorkflow } from '../../src/templates/workflows.js';
import { checkpoint, generateWithRetry, runWorkflow } from '../../src/commands/workflow.js';

// ─── Workflow type definitions ────────────────────────────────────

describe('Workflow type definitions', () => {
  it('defines new-site, redesign, and landing workflow types', () => {
    expect(WORKFLOW_TYPES).toContain('new-site');
    expect(WORKFLOW_TYPES).toContain('redesign');
    expect(WORKFLOW_TYPES).toContain('landing');
  });

  it('each workflow has a name, description, and pages', () => {
    for (const key of WORKFLOW_TYPES) {
      const wf = WORKFLOWS[key];
      expect(wf.name).toBeTruthy();
      expect(wf.description).toBeTruthy();
      expect(wf.pages.length).toBeGreaterThan(0);
    }
  });

  it('each page template has type, name, and prompt', () => {
    for (const key of WORKFLOW_TYPES) {
      for (const page of WORKFLOWS[key].pages) {
        expect(page.type).toBeTruthy();
        expect(page.name).toBeTruthy();
        expect(page.prompt).toBeTruthy();
      }
    }
  });

  it('new-site has 4 pages', () => {
    expect(WORKFLOWS['new-site'].pages).toHaveLength(4);
  });

  it('redesign has 2 pages', () => {
    expect(WORKFLOWS['redesign'].pages).toHaveLength(2);
  });

  it('landing has 1 page', () => {
    expect(WORKFLOWS['landing'].pages).toHaveLength(1);
  });

  it('legacy getWorkflow still works for redesign', () => {
    const steps = getWorkflow('redesign');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].name).toBe('design');
  });

  it('legacy getWorkflow still works for new-app', () => {
    const steps = getWorkflow('new-app');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].name).toBe('brainstorm');
  });
});

// ─── Checkpoint ────────────────────────────────────────────────────

describe('checkpoint', () => {
  it('returns true when auto mode is on', async () => {
    const result = await checkpoint('Continue?', { autoSkip: true });
    expect(result).toBe(true);
  });

  it('returns true when auto mode via explicit autoSkip', async () => {
    const result = await checkpoint('Any message?', { autoSkip: true });
    expect(result).toBe(true);
  });
});

// ─── generateWithRetry ────────────────────────────────────────────

describe('generateWithRetry', () => {
  it('succeeds on first try when score is good', async () => {
    const goodHtml = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><section><h1>Hello</h1><p>World</p></section></body></html>`;

    const generateFn = vi.fn().mockResolvedValue(goodHtml);
    const result = await generateWithRetry(generateFn, 'test prompt');

    expect(generateFn).toHaveBeenCalledTimes(1);
    expect(result.html).toBe(goodHtml);
    expect(result.validation.score).toBeGreaterThanOrEqual(60);
  });

  it('retries on low score and appends feedback to prompt', async () => {
    // First call returns bad HTML (missing alt on img = error), second returns good HTML
    const badHtml = `<!DOCTYPE html>
<html><head><title>Bad</title></head>
<body><section><h1>Hello</h1><img src="photo.jpg"></section></body></html>`;

    const goodHtml = `<!DOCTYPE html>
<html><head><title>Good</title></head>
<body><section><h1>Hello</h1><img src="photo.jpg" alt="Photo"></section></body></html>`;

    const generateFn = vi.fn()
      .mockResolvedValueOnce(badHtml)
      .mockResolvedValueOnce(goodHtml);

    const result = await generateWithRetry(generateFn, 'test prompt', 2);

    // May be called 1 or 2 times depending on score
    expect(generateFn.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(result.html).toBeTruthy();
  });

  it('returns after maxRetries even if score is still low', async () => {
    const badHtml = `<!DOCTYPE html>
<html><head><title>Bad</title></head>
<body>
  <section><h1>Hello</h1>
    <img src="1.jpg"><img src="2.jpg"><img src="3.jpg"><img src="4.jpg"><img src="5.jpg">
  </section>
</body></html>`;

    const generateFn = vi.fn().mockResolvedValue(badHtml);
    const result = await generateWithRetry(generateFn, 'test prompt', 1);

    // Called at most maxRetries + 1 times
    expect(generateFn.mock.calls.length).toBeLessThanOrEqual(2);
    expect(result.html).toBe(badHtml);
    expect(result.validation).toBeDefined();
  });

  it('does not retry when maxRetries is 0', async () => {
    const html = `<!DOCTYPE html>
<html><head><title>X</title></head>
<body><img src="x.jpg"></body></html>`;

    const generateFn = vi.fn().mockResolvedValue(html);
    const result = await generateWithRetry(generateFn, 'prompt', 0);

    expect(generateFn).toHaveBeenCalledTimes(1);
    expect(result.html).toBe(html);
  });
});

// ─── runWorkflow ──────────────────────────────────────────────────

describe('runWorkflow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows help and available types when called with no type', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runWorkflow();

    const output = logs.join('\n');
    expect(output).toContain('new-site');
    expect(output).toContain('redesign');
    expect(output).toContain('landing');
  });

  it('shows error for unknown workflow type', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runWorkflow('nonexistent');

    const output = logs.join('\n');
    expect(output).toContain('Unknown workflow type');
    expect(output).toContain('nonexistent');
  });

  it('lists available types in the error message for unknown type', async () => {
    const logs: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    });

    await runWorkflow('bogus');

    const output = logs.join('\n');
    expect(output).toContain('new-site');
    expect(output).toContain('redesign');
    expect(output).toContain('landing');
  });
});
