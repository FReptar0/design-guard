import { load } from 'cheerio';
import { existsSync, readFileSync } from 'node:fs';
import { getAllRules } from './rules/index.js';
import type { LintContext } from './rules/types.js';

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'color' | 'typography' | 'accessibility' | 'slop' | 'structure';
  message: string;
}

export interface OutputValidationResult {
  score: number; // 0-100
  issues: ValidationIssue[];
  passed: boolean;
}

/**
 * Validate generated HTML against design system and quality rules.
 *
 * Uses the modular rule registry — each check is an independent LintRule.
 */
export function validateOutput(html: string): OutputValidationResult {
  const $ = load(html);

  // Build shared context once for all rules
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

  // Load DESIGN.md content if available
  let designMdContent: string | undefined;
  if (existsSync('DESIGN.md')) {
    designMdContent = readFileSync('DESIGN.md', 'utf-8');
  }

  const context: LintContext = {
    html,
    allStyles,
    allClasses,
    $,
    designMdContent,
  };

  // Run all rules
  const issues: ValidationIssue[] = [];
  for (const rule of getAllRules()) {
    const ruleIssues = rule.check(context);
    issues.push(...ruleIssues);
  }

  // Calculate score (same formula as before)
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const warningCount = issues.filter((i) => i.type === 'warning').length;
  const infoCount = issues.filter((i) => i.type === 'info').length;
  const score = Math.max(
    0,
    100 - errorCount * 15 - warningCount * 8 - infoCount * 3,
  );

  return {
    score,
    issues,
    passed: score >= 60,
  };
}

/**
 * Format validation results for display.
 */
export function formatValidationReport(
  result: OutputValidationResult,
): string {
  const lines: string[] = [];

  lines.push(
    `Quality Score: ${result.score}/100 (${result.passed ? 'PASS' : 'NEEDS REVIEW'})`,
  );
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('No issues detected.');
    return lines.join('\n');
  }

  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');
  const infos = result.issues.filter((i) => i.type === 'info');

  if (errors.length > 0) {
    lines.push('Errors:');
    errors.forEach((e) => lines.push(`  [x] ${e.message}`));
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('Warnings:');
    warnings.forEach((w) => lines.push(`  [!] ${w.message}`));
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push('Info:');
    infos.forEach((i) => lines.push(`  [i] ${i.message}`));
  }

  return lines.join('\n');
}
