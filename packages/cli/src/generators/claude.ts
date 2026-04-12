/**
 * Claude Direct generator adapter.
 *
 * Generates HTML/CSS directly using Claude Code — no external API needed.
 * This adapter creates structured prompt files that Claude Code skills
 * can pick up to generate screens locally.
 *
 * Ideal for users who want to use Design Guard without a Stitch account.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { DesignGenerator, GeneratedScreen, GeneratorConfig } from './types.js';

export class ClaudeDirectGenerator implements DesignGenerator {
  readonly name = 'Claude Direct';
  private screensDir = 'screens';

  async initialize(_config: GeneratorConfig): Promise<void> {
    // No external auth needed — Claude Code is the runtime
    if (!existsSync(this.screensDir)) {
      mkdirSync(this.screensDir, { recursive: true });
    }
  }

  async generateScreen(prompt: string, options?: {
    designMd?: string;
    model?: string;
    screenName?: string;
  }): Promise<GeneratedScreen> {
    const designMd = options?.designMd !== undefined ? options.designMd : this.readDesignMd();
    const screenName = options?.screenName || `screen-${Date.now()}`;

    // Build a structured prompt that Claude Code can use to generate HTML
    const fullPrompt = this.buildClaudePrompt(prompt, designMd);

    // Ensure screens directory exists
    if (!existsSync(this.screensDir)) {
      mkdirSync(this.screensDir, { recursive: true });
    }

    // Save the prompt as a generation request
    const requestPath = join(this.screensDir, `${screenName}.prompt.md`);
    writeFileSync(requestPath, fullPrompt);

    return {
      id: screenName,
      name: screenName,
      html: `<!-- Generation request saved to ${requestPath}. Use Claude Code to generate the HTML. -->`,
      metadata: {
        generator: 'claude-direct',
        promptPath: requestPath,
        prompt: fullPrompt,
      },
    };
  }

  async listScreens(_projectId: string): Promise<GeneratedScreen[]> {
    if (!existsSync(this.screensDir)) return [];

    const files = readdirSync(this.screensDir).filter(f => f.endsWith('.html'));
    return files.map(f => {
      const name = basename(f, '.html');
      const filePath = join(this.screensDir, f);
      return {
        id: name,
        name,
        html: readFileSync(filePath, 'utf-8'),
        metadata: { generator: 'claude-direct' },
      };
    });
  }

  async getScreenCode(screenId: string): Promise<string> {
    const path = join(this.screensDir, `${screenId}.html`);
    if (existsSync(path)) return readFileSync(path, 'utf-8');
    throw new Error(`Screen not found: ${screenId}`);
  }

  async isAvailable(): Promise<boolean> {
    // Always available — Claude Code is the runtime environment
    return true;
  }

  private readDesignMd(): string {
    if (existsSync('DESIGN.md')) {
      return readFileSync('DESIGN.md', 'utf-8');
    }
    return '';
  }

  private buildClaudePrompt(userPrompt: string, designMd: string): string {
    return [
      '# Screen Generation Request',
      '',
      '## Design System',
      designMd || '_No DESIGN.md found. Generate with sensible defaults._',
      '',
      '## Requirements',
      userPrompt,
      '',
      '## Constraints',
      '- Generate a single, complete HTML page with embedded CSS',
      '- Follow the design system exactly (colors, fonts, spacing)',
      '- Use semantic HTML5 elements',
      '- Ensure mobile-responsive layout',
      '- No JavaScript unless explicitly requested',
      '- No external CDN dependencies',
    ].join('\n');
  }
}
