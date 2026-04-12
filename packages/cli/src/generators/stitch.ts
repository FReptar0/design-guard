/**
 * Stitch generator adapter — wraps the existing MCP client.
 *
 * This adapter delegates all generation to Google Stitch via the
 * StitchMcpClient, mapping responses to the DesignGenerator interface.
 */

import { StitchMcpClient } from '../mcp/client.js';
import { getConfig } from '../utils/config.js';
import { getQuotaStatus } from '../utils/quota.js';
import type { DesignGenerator, GeneratedScreen, GeneratorConfig } from './types.js';

export class StitchGenerator implements DesignGenerator {
  readonly name = 'Google Stitch';
  private client: StitchMcpClient | null = null;
  private projectId: string | undefined;

  async initialize(config: GeneratorConfig): Promise<void> {
    this.projectId = config.projectId;
    // StitchMcpClient reads its API key from config/env in its constructor
    this.client = new StitchMcpClient();
  }

  async generateScreen(prompt: string, options?: {
    designMd?: string;
    model?: string;
    screenName?: string;
  }): Promise<GeneratedScreen> {
    const client = this.getClient();
    const projectId = this.resolveProjectId();

    const model = options?.model || 'GEMINI_2_5_FLASH';
    const result = await client.generateScreen(projectId, prompt, model);

    // Retrieve the HTML code for the generated screen
    let html = '';
    try {
      html = await client.getScreenCode(projectId, result.screenId, result.htmlCodeUrl);
    } catch {
      // Screen code may not be immediately available
      html = `<!-- Screen generated (${result.screenId}) but HTML not yet available. Run \`dg sync\` to retrieve. -->`;
    }

    return {
      id: result.screenId,
      name: result.name || options?.screenName || result.screenId,
      html,
      screenshot: result.screenshotUrl,
      metadata: {
        generator: 'stitch',
        projectId,
        model,
      },
    };
  }

  async listScreens(projectId: string): Promise<GeneratedScreen[]> {
    const client = this.getClient();
    const screens = await client.listScreens(projectId);

    return screens.map(s => ({
      id: s.id,
      name: s.name,
      html: '', // HTML not fetched during listing — use getScreenCode for that
      metadata: {
        generator: 'stitch',
        prompt: s.prompt,
        createdAt: s.createdAt,
      },
    }));
  }

  async getScreenCode(screenId: string): Promise<string> {
    const client = this.getClient();
    const projectId = this.resolveProjectId();
    return client.getScreenCode(projectId, screenId);
  }

  async isAvailable(): Promise<boolean> {
    // Check if STITCH_API_KEY is set in environment or config
    const config = getConfig();
    return !!(config.apiKey || process.env.STITCH_API_KEY);
  }

  async getQuotaInfo(): Promise<{ used: number; limit: number; model: string }[]> {
    const status = getQuotaStatus();
    return [
      { used: status.flash.used, limit: status.flash.limit, model: 'GEMINI_2_5_FLASH' },
      { used: status.pro.used, limit: status.pro.limit, model: 'GEMINI_3_PRO' },
    ];
  }

  /** Get the underlying MCP client for direct access (e.g., build command) */
  getMcpClient(): StitchMcpClient {
    return this.getClient();
  }

  private getClient(): StitchMcpClient {
    if (!this.client) {
      throw new Error('Stitch not initialized. Run `dg init` first.');
    }
    return this.client;
  }

  private resolveProjectId(): string {
    const id = this.projectId || getConfig().projectId;
    if (!id) {
      throw new Error('No project ID configured. Use --project <id> or run `dg init`.');
    }
    return id;
  }
}
