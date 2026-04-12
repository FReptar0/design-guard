/**
 * Generator registry — maps generator names to their factory functions.
 *
 * Usage:
 *   const gen = getGenerator('stitch');
 *   await gen.initialize({ type: 'stitch', projectId: '123' });
 *   const screen = await gen.generateScreen('A landing page for...');
 */

import type { DesignGenerator } from './types.js';
import { StitchGenerator } from './stitch.js';
import { ClaudeDirectGenerator } from './claude.js';

const generators = new Map<string, () => DesignGenerator>([
  ['stitch', () => new StitchGenerator() as DesignGenerator],
  ['claude', () => new ClaudeDirectGenerator() as DesignGenerator],
]);

/**
 * Get a generator instance by name.
 * @throws Error if generator name is not registered
 */
export function getGenerator(name: string): DesignGenerator {
  const factory = generators.get(name);
  if (!factory) {
    throw new Error(
      `Unknown generator: "${name}". Available generators: ${[...generators.keys()].join(', ')}`
    );
  }
  return factory();
}

/** List all registered generator names. */
export function listGenerators(): string[] {
  return [...generators.keys()];
}

export { StitchGenerator } from './stitch.js';
export { ClaudeDirectGenerator } from './claude.js';
export type { DesignGenerator, GeneratedScreen, GeneratorConfig } from './types.js';
