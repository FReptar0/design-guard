/**
 * Generator adapter interface — enables pluggable design generators.
 *
 * The DesignGenerator interface abstracts away the underlying generation
 * service (Google Stitch, Claude Direct, etc.) so the CLI commands can
 * work with any backend that satisfies the contract.
 */

export interface GeneratedScreen {
  id: string;
  name: string;
  html: string;
  css?: string;
  screenshot?: string; // base64
  metadata?: Record<string, unknown>;
}

export interface GeneratorConfig {
  type: string;
  projectId?: string;
  model?: string;
  [key: string]: unknown;
}

export interface DesignGenerator {
  /** Generator name for display */
  readonly name: string;

  /** Initialize the generator (auth, project selection, etc.) */
  initialize(config: GeneratorConfig): Promise<void>;

  /** Generate a screen from a text prompt */
  generateScreen(prompt: string, options?: {
    designMd?: string;
    model?: string;
    screenName?: string;
  }): Promise<GeneratedScreen>;

  /** List existing screens/generations */
  listScreens(projectId: string): Promise<GeneratedScreen[]>;

  /** Get a specific screen's HTML */
  getScreenCode(screenId: string): Promise<string>;

  /** Check if generator is available and authenticated */
  isAvailable(): Promise<boolean>;

  /** Get quota/usage info (optional — not all generators track quota) */
  getQuotaInfo?(): Promise<{ used: number; limit: number; model: string }[]>;
}
