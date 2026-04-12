import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve, extname, relative } from 'node:path';
import chalk from 'chalk';
import { validateOutput, scoreDesignMd, formatValidationReport, formatDesignQualityReport } from '@design-guard/core';
import { log } from '../utils/logger.js';
import type { OutputValidationResult, ValidationIssue, DesignQualityScore } from '@design-guard/core';

export interface LintOptions {
  designSystem?: string;
  format?: 'terminal' | 'json' | 'sarif';
  failOnError?: boolean;
  failThreshold?: number;
}

interface FileResult {
  file: string;
  score: number;
  passed: boolean;
  issues: ValidationIssue[];
}

interface LintSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  warnings: number;
  info: number;
}

export async function runLint(targets: string[], options: LintOptions): Promise<void> {
  // 1. Find DESIGN.md (explicit --design-system path, or auto-detect in cwd/parent dirs)
  const designMdPath = options.designSystem
    ? resolve(options.designSystem)
    : findDesignMd();

  if (!designMdPath || !existsSync(designMdPath)) {
    log.error('No DESIGN.md found. Specify with --design-system or create one with `dg design`.');
    process.exit(1);
  }

  const designMd = readFileSync(designMdPath, 'utf-8');

  // 2. Score the DESIGN.md itself
  const designScore = scoreDesignMd(designMd);

  // 3. Resolve file targets (files and directories)
  const htmlFiles = resolveTargets(targets);
  if (htmlFiles.length === 0) {
    log.error('No HTML files found to lint.');
    process.exit(1);
  }

  // 4. Validate each file
  const results: FileResult[] = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf-8');
    const result = validateOutput(html);
    results.push({
      file,
      score: result.score,
      passed: result.passed,
      issues: result.issues,
    });
  }

  // 5. Compute summary
  const summary = computeSummary(results);

  // 6. Output results in requested format
  switch (options.format) {
    case 'json':
      outputJson(results, designScore, designMdPath, summary);
      break;
    case 'sarif':
      outputSarif(results);
      break;
    default:
      outputTerminal(results, designScore, summary);
  }

  // 7. Exit code based on results
  const hasErrors = results.some(r => r.issues.some(i => i.type === 'error'));
  const minScore = results.length > 0
    ? Math.min(...results.map(r => r.score))
    : 100;

  if (options.failOnError && hasErrors) {
    process.exit(1);
  }
  if (options.failThreshold !== undefined && minScore < options.failThreshold) {
    process.exit(1);
  }
}

// --- File Discovery ---------------------------------------------------------

export function findDesignMd(): string | null {
  let dir = process.cwd();
  const root = resolve('/');
  while (true) {
    const candidate = join(dir, 'DESIGN.md');
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir || dir === root) break;
    dir = parent;
  }
  return null;
}

export function resolveTargets(targets: string[]): string[] {
  const files: string[] = [];
  for (const target of targets) {
    const resolved = resolve(target);
    if (!existsSync(resolved)) continue;
    if (statSync(resolved).isDirectory()) {
      collectHtmlFiles(resolved, files);
    } else if (extname(resolved) === '.html') {
      files.push(resolved);
    }
  }
  return files;
}

function collectHtmlFiles(dir: string, files: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
      collectHtmlFiles(full, files);
    } else if (entry.isFile() && extname(entry.name) === '.html') {
      files.push(full);
    }
  }
}

// --- Summary ----------------------------------------------------------------

function computeSummary(results: FileResult[]): LintSummary {
  let errors = 0;
  let warnings = 0;
  let info = 0;
  let passed = 0;
  let failed = 0;

  for (const r of results) {
    if (r.passed) passed++;
    else failed++;
    for (const issue of r.issues) {
      if (issue.type === 'error') errors++;
      else if (issue.type === 'warning') warnings++;
      else info++;
    }
  }

  return { total: results.length, passed, failed, errors, warnings, info };
}

// --- Terminal Output --------------------------------------------------------

function severityIcon(type: string): string {
  switch (type) {
    case 'error': return chalk.red('\u2715');
    case 'warning': return chalk.yellow('\u25B3');
    default: return chalk.dim('\u25CB');
  }
}

function severityLabel(type: string): string {
  switch (type) {
    case 'error': return chalk.red('error  ');
    case 'warning': return chalk.yellow('warning');
    default: return chalk.dim('info   ');
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return chalk.green(String(score));
  if (score >= 60) return chalk.yellow(String(score));
  return chalk.red(String(score));
}

function dimensionLine(label: string, score: number, max: number): string {
  const ok = score >= max * 0.6;
  const icon = ok ? chalk.green('\u2713') : chalk.yellow('\u25B3');
  return `  ${icon} ${label}: ${score}/${max}`;
}

function outputTerminal(results: FileResult[], designScore: DesignQualityScore, summary: LintSummary): void {
  // Design system quality
  console.log('');
  console.log(chalk.bold(`DESIGN.md Quality Score: ${scoreColor(designScore.total)}/100`));
  console.log(dimensionLine('Specificity', designScore.specificity, 25));
  console.log(dimensionLine('Differentiation', designScore.differentiation, 25));
  console.log(dimensionLine('Completeness', designScore.completeness, 25));
  console.log(dimensionLine('Actionability', designScore.actionability, 25));
  console.log('');

  // Per-file results
  for (const r of results) {
    const relPath = relative(process.cwd(), r.file);
    const statusIcon = r.passed ? chalk.green('\u2713') : chalk.red('\u2715');
    console.log(`${statusIcon} ${chalk.bold(relPath)} ${chalk.dim('\u2014')} Score: ${scoreColor(r.score)}/100`);

    if (r.issues.length === 0) {
      console.log(chalk.dim('  No issues found.'));
    } else {
      for (const issue of r.issues) {
        console.log(`  ${severityIcon(issue.type)} ${severityLabel(issue.type)} ${issue.message}`);
      }
    }
    console.log('');
  }

  // Summary line
  const summaryParts: string[] = [];
  if (summary.errors > 0) summaryParts.push(chalk.red(`${summary.errors} error${summary.errors !== 1 ? 's' : ''}`));
  if (summary.warnings > 0) summaryParts.push(chalk.yellow(`${summary.warnings} warning${summary.warnings !== 1 ? 's' : ''}`));
  if (summary.info > 0) summaryParts.push(chalk.dim(`${summary.info} info`));

  console.log(chalk.bold(`Summary: ${summary.total} file${summary.total !== 1 ? 's' : ''}, ${summary.passed} passed, ${summary.failed} failed`));
  if (summaryParts.length > 0) {
    console.log(`  ${summaryParts.join(', ')}`);
  }
}

// --- JSON Output ------------------------------------------------------------

interface JsonOutput {
  designSystem: {
    path: string;
    score: number;
    dimensions: {
      specificity: number;
      differentiation: number;
      completeness: number;
      actionability: number;
    };
  };
  files: Array<{
    path: string;
    score: number;
    passed: boolean;
    issues: Array<{
      severity: string;
      message: string;
      category: string;
    }>;
  }>;
  summary: LintSummary;
}

function outputJson(
  results: FileResult[],
  designScore: DesignQualityScore,
  designMdPath: string,
  summary: LintSummary,
): void {
  const output: JsonOutput = {
    designSystem: {
      path: relative(process.cwd(), designMdPath),
      score: designScore.total,
      dimensions: {
        specificity: designScore.specificity,
        differentiation: designScore.differentiation,
        completeness: designScore.completeness,
        actionability: designScore.actionability,
      },
    },
    files: results.map(r => ({
      path: relative(process.cwd(), r.file),
      score: r.score,
      passed: r.passed,
      issues: r.issues.map(i => ({
        severity: i.type,
        message: i.message,
        category: i.category,
      })),
    })),
    summary,
  };
  console.log(JSON.stringify(output, null, 2));
}

// --- SARIF Output -----------------------------------------------------------

function outputSarif(results: FileResult[]): void {
  const sarifResults: Array<{
    ruleId: string;
    level: string;
    message: { text: string };
    locations: Array<{
      physicalLocation: {
        artifactLocation: { uri: string };
      };
    }>;
  }> = [];

  for (const r of results) {
    for (const issue of r.issues) {
      sarifResults.push({
        ruleId: issue.category,
        level: issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'note',
        message: { text: issue.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: relative(process.cwd(), r.file) },
          },
        }],
      });
    }
  }

  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'design-guard',
          version: '0.3.1',
          informationUri: 'https://github.com/freptar0/stitch-forge',
        },
      },
      results: sarifResults,
    }],
  };
  console.log(JSON.stringify(sarif, null, 2));
}
