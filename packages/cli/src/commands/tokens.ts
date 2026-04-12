/**
 * Token CLI commands: export DESIGN.md to design tokens, import tokens into DESIGN.md.
 *
 * dg tokens export [--format dtcg|css|json] [--output <path>]
 * dg tokens import <token-file> [--merge]
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  designMdToDTCG,
  dtcgToDesignMd,
  dtcgToCSS,
  dtcgToFlatJSON,
} from '@design-guard/core';
import type { DTCGFile } from '@design-guard/core';

/**
 * Export DESIGN.md as design tokens.
 */
export async function runTokensExport(options: {
  format?: string;
  output?: string;
}): Promise<void> {
  const designPath = resolve('DESIGN.md');

  if (!existsSync(designPath)) {
    console.error(
      'No DESIGN.md found in the current directory. Run `dg design` first.',
    );
    process.exitCode = 1;
    return;
  }

  const designMd = readFileSync(designPath, 'utf-8');
  const tokens = designMdToDTCG(designMd);
  const format = options.format || 'dtcg';

  let output: string;

  switch (format) {
    case 'css':
      output = dtcgToCSS(tokens);
      break;
    case 'json':
      output = JSON.stringify(dtcgToFlatJSON(tokens), null, 2);
      break;
    case 'dtcg':
    default:
      output = JSON.stringify(tokens, null, 2);
      break;
  }

  if (options.output) {
    const outPath = resolve(options.output);
    writeFileSync(outPath, output, 'utf-8');
    console.log(`Tokens exported to ${outPath} (${format} format)`);
  } else {
    console.log(output);
  }
}

/**
 * Import design tokens into DESIGN.md.
 */
export async function runTokensImport(
  tokenFile: string,
  options: { merge?: boolean },
): Promise<void> {
  const filePath = resolve(tokenFile);

  if (!existsSync(filePath)) {
    console.error(`Token file not found: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  const raw = readFileSync(filePath, 'utf-8');
  let tokens: DTCGFile;

  try {
    tokens = JSON.parse(raw) as DTCGFile;
  } catch {
    console.error('Failed to parse token file — expected valid JSON in DTCG format.');
    process.exitCode = 1;
    return;
  }

  const generatedSections = dtcgToDesignMd(tokens);

  if (options.merge) {
    const designPath = resolve('DESIGN.md');
    if (!existsSync(designPath)) {
      console.error('No DESIGN.md found to merge into. Remove --merge or create DESIGN.md first.');
      process.exitCode = 1;
      return;
    }

    const existing = readFileSync(designPath, 'utf-8');
    const merged = mergeSections(existing, generatedSections);
    writeFileSync(designPath, merged, 'utf-8');
    console.log('DESIGN.md updated with imported tokens (merged).');
  } else {
    const designPath = resolve('DESIGN.md');
    writeFileSync(designPath, generatedSections, 'utf-8');
    console.log('DESIGN.md created from imported tokens.');
  }
}

/**
 * Merge generated sections into an existing DESIGN.md.
 * Replaces sections 2, 3, 4 if present in the generated output.
 */
function mergeSections(existing: string, generated: string): string {
  let result = existing;

  // For each numbered section in the generated output, replace in existing
  const sectionPattern = /## (\d+)\..*/g;
  let match;
  const sectionNumbers: number[] = [];

  while ((match = sectionPattern.exec(generated)) !== null) {
    sectionNumbers.push(parseInt(match[1], 10));
  }

  for (const num of sectionNumbers) {
    const newSection = extractFullSection(generated, num);
    if (!newSection) continue;

    const existingSection = extractFullSection(existing, num);
    if (existingSection) {
      result = result.replace(existingSection, newSection);
    } else {
      // Append before next section or at end
      const nextPattern = new RegExp(`(## ${num + 1}\\.)`);
      const nextMatch = result.match(nextPattern);
      if (nextMatch && nextMatch.index !== undefined) {
        result = result.slice(0, nextMatch.index) + newSection + '\n\n' + result.slice(nextMatch.index);
      } else {
        result = result.trimEnd() + '\n\n' + newSection + '\n';
      }
    }
  }

  return result;
}

/**
 * Extract a full section (header + content) from markdown.
 */
function extractFullSection(markdown: string, sectionNumber: number): string | null {
  const pattern = new RegExp(
    `(## ${sectionNumber}\\.[^\n]*\n[\\s\\S]*?)(?=## \\d+\\.|$)`,
  );
  const match = markdown.match(pattern);
  return match ? match[1].trimEnd() : null;
}
