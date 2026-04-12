import { createInterface } from 'node:readline';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { WORKFLOWS, WORKFLOW_TYPES, type WorkflowDefinition, type WorkflowPageTemplate, getWorkflow } from '../templates/workflows.js';
import { validateOutput, scoreDesignMd, formatDesignQualityReport, researchBusiness, synthesizeDesign, cacheResearch, generateDesignMdTemplate } from '@design-guard/core';
import type { OutputValidationResult } from '@design-guard/core';
import type { BusinessBrief, BusinessResearchResult } from '@design-guard/core';

export interface WorkflowOptions {
  url?: string;
  competitors?: string;
  locale?: string;
  framework?: string;
  generator?: string;
  auto?: boolean;
}

interface GeneratedScreen {
  name: string;
  html: string;
  file: string;
  validation: OutputValidationResult;
}

// ─── Checkpoint ────────────────────────────────────────────────────

/**
 * Presents a checkpoint to the user and waits for their decision.
 * Returns true to continue, false to abort.
 * In auto mode, always returns true.
 */
export async function checkpoint(
  message: string,
  options?: { autoSkip?: boolean },
): Promise<boolean> {
  if (options?.autoSkip) return true;

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await new Promise<string>((resolve) => {
    rl.question(`${message} [Y/n/e] `, resolve);
  });
  rl.close();

  const choice = answer.trim().toLowerCase();
  if (choice === 'n') return false;
  if (choice === 'e') {
    log.info('Edit the file, then press Enter to continue...');
    const rl2 = createInterface({ input: process.stdin, output: process.stderr });
    await new Promise<string>((resolve) => {
      rl2.question('Press Enter when ready... ', resolve);
    });
    rl2.close();
  }
  return true;
}

// ─── Generate with retry ──────────────────────────────────────────

/**
 * Generate a screen from a prompt, retrying with lint feedback when the
 * validation score falls below the threshold.
 */
export async function generateWithRetry(
  generateFn: (prompt: string) => Promise<string>,
  prompt: string,
  maxRetries: number = 2,
): Promise<{ html: string; validation: OutputValidationResult }> {
  let currentPrompt = prompt;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const html = await generateFn(currentPrompt);

    const validation = validateOutput(html);

    if (validation.score >= 60 || attempt === maxRetries) {
      return { html, validation };
    }

    // Build feedback for retry
    const issues = validation.issues
      .filter((i) => i.type === 'error')
      .map((i) => `- Fix: ${i.message}`)
      .join('\n');
    currentPrompt = `${prompt}\n\nIMPORTANT: The previous generation had these issues that MUST be fixed:\n${issues}`;
    log.warn(
      `Screen scored ${validation.score}/100. Retrying with feedback (attempt ${attempt + 2}/${maxRetries + 1})...`,
    );
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Generation failed after retries');
}

// ─── Workflow runner ──────────────────────────────────────────────

export async function runWorkflow(
  type?: string,
  options: WorkflowOptions = {},
): Promise<void> {
  // If no type or unrecognized type, show help
  if (!type || !WORKFLOWS[type]) {
    log.info('Available workflows:');
    log.info('');
    for (const [key, def] of Object.entries(WORKFLOWS)) {
      log.info(`  ${key.padEnd(12)} ${def.name}`);
      log.info(`               ${def.description}`);
      log.info(`               Pages: ${def.pages.map((p) => p.name).join(', ')}`);
      log.info('');
    }
    log.info(`Usage: dg workflow <${WORKFLOW_TYPES.join('|')}>`);

    if (type && !WORKFLOWS[type]) {
      log.error(`Unknown workflow type "${type}". Available types: ${WORKFLOW_TYPES.join(', ')}`);
    }
    return;
  }

  const workflow = WORKFLOWS[type];
  const totalSteps = countSteps(workflow, options);
  let currentStep = 0;

  log.info(`Starting workflow: ${workflow.name}`);
  log.info(`  ${workflow.description}`);
  log.info(`  Pages: ${workflow.pages.length}`);
  log.info('');

  // ── Step 1: Research (if URL provided) ──────────────────────────
  let research: BusinessResearchResult | undefined;

  if (options.url) {
    currentStep++;
    log.step(currentStep, totalSteps, 'Researching business...');

    const brief: BusinessBrief = {
      companyName: 'Company',
      industry: 'Technology',
      targetAudience: 'General',
      aesthetic: 'modern confident',
      websiteUrl: options.url,
      competitorUrls: options.competitors?.split(',').map((s) => s.trim()),
      locale: options.locale,
    };

    try {
      research = await researchBusiness(brief);
      log.info(`  Research confidence: ${research.confidence}%`);
      if (research.currentSite) {
        log.info(`  Current site analyzed: ${research.currentSite.url}`);
        log.info(`  Colors found: ${research.currentSite.palette.colors.length}`);
      }
      if (research.competitors.length > 0) {
        log.info(`  Competitors analyzed: ${research.competitors.map((c) => c.name).join(', ')}`);
      }

      // Cache
      try {
        cacheResearch(brief.companyName, research);
      } catch { /* non-critical */ }

      // Checkpoint: show research summary
      const proceed = await checkpoint(
        'Research complete. Continue to design system generation?',
        { autoSkip: options.auto },
      );
      if (!proceed) {
        log.info('Workflow stopped by user after research step.');
        return;
      }
    } catch (err) {
      log.warn(`Research failed: ${err instanceof Error ? err.message : 'unknown error'}. Continuing without research data.`);
    }
  }

  // ── Step 2: Design System ───────────────────────────────────────
  currentStep++;
  log.step(currentStep, totalSteps, 'Generating design system...');

  let designMd: string;

  if (research && research.confidence >= 30) {
    const design = synthesizeDesign(research);
    designMd = design.markdown;
    writeFileSync('DESIGN.md', designMd);

    log.info('');
    log.info(formatDesignQualityReport(design.qualityScore));
    log.info('');
    log.info(`  Token estimate: ${design.tokenEstimate}`);

    if (design.qualityScore.total < 70) {
      log.warn(`Design quality score is ${design.qualityScore.total}/100 (below 70). Consider providing competitor URLs or editing DESIGN.md.`);
    }
  } else {
    // Fallback: generate from template
    const brief = {
      companyName: 'Company',
      industry: 'Technology',
      targetAudience: 'General',
      aesthetic: 'modern confident',
    };
    designMd = generateDesignMdTemplate(brief);
    writeFileSync('DESIGN.md', designMd);
    log.info('  Generated DESIGN.md from template (no research data available).');

    const score = scoreDesignMd(designMd);
    log.info(`  Quality: ${score.total}/100`);
  }

  // Checkpoint: let user review DESIGN.md
  const designProceed = await checkpoint(
    'DESIGN.md created. Review it, then continue to screen generation?',
    { autoSkip: options.auto },
  );
  if (!designProceed) {
    log.info('Workflow stopped by user after design step.');
    return;
  }

  // Re-read DESIGN.md in case user edited it during checkpoint
  if (existsSync('DESIGN.md')) {
    designMd = readFileSync('DESIGN.md', 'utf-8');
  }

  // ── Step 3: Generate Screens ────────────────────────────────────
  currentStep++;
  log.step(currentStep, totalSteps, `Generating ${workflow.pages.length} screen(s)...`);

  if (!existsSync('screens')) mkdirSync('screens');

  const generatedScreens: GeneratedScreen[] = [];
  const generator = options.generator || 'claude';

  for (let i = 0; i < workflow.pages.length; i++) {
    const page = workflow.pages[i];
    const pageNum = i + 1;
    log.info(`  [${pageNum}/${workflow.pages.length}] Generating: ${page.name}...`);

    const fullPrompt = buildScreenPrompt(page, designMd);

    try {
      const { html, validation } = await generateWithRetry(
        async (prompt) => generateScreen(prompt, generator),
        fullPrompt,
      );

      const filename = `screens/${page.type}.html`;
      writeFileSync(filename, html);

      generatedScreens.push({
        name: page.name,
        html,
        file: filename,
        validation,
      });

      const statusIcon = validation.passed ? 'PASS' : 'NEEDS REVIEW';
      log.info(`    Score: ${validation.score}/100 (${statusIcon}) -> ${filename}`);
    } catch (err) {
      log.error(`    Failed to generate ${page.name}: ${err instanceof Error ? err.message : 'unknown error'}`);
      generatedScreens.push({
        name: page.name,
        html: '',
        file: '',
        validation: {
          score: 0, issues: [], passed: false, confidence: 0,
          breakdown: {
            typography: { score: 0, issues: 0, maxPossible: 0 },
            color: { score: 0, issues: 0, maxPossible: 0 },
            layout: { score: 0, issues: 0, maxPossible: 0 },
            content: { score: 0, issues: 0, maxPossible: 0 },
            structure: { score: 0, issues: 0, maxPossible: 0 },
            slop: { score: 0, issues: 0, maxPossible: 0 },
            accessibility: { score: 0, issues: 0, maxPossible: 0 },
          },
        },
      });
    }
  }

  // Show screen generation summary
  log.info('');
  log.info('Screen generation summary:');
  for (const screen of generatedScreens) {
    const status = screen.validation.passed ? 'PASS' : 'FAIL';
    log.info(`  ${screen.name}: ${screen.validation.score}/100 (${status})`);
  }

  const failedScreens = generatedScreens.filter((s) => !s.validation.passed);
  if (failedScreens.length > 0) {
    log.warn(`${failedScreens.length} screen(s) below threshold. Review before building.`);
  }

  // Checkpoint: show screen scores
  const screensProceed = await checkpoint(
    'Screen generation complete. Continue to build?',
    { autoSkip: options.auto },
  );
  if (!screensProceed) {
    log.info('Workflow stopped by user after generation step.');
    return;
  }

  // ── Step 4: Build Site ──────────────────────────────────────────
  currentStep++;
  log.step(currentStep, totalSteps, 'Building site...');

  const framework = options.framework || 'static';
  log.info(`  Framework: ${framework}`);

  try {
    const { getAdapter } = await import('../adapters/index.js');
    const validFrameworks = ['static', 'nextjs'] as const;
    type ValidFramework = (typeof validFrameworks)[number];

    const fw = validFrameworks.includes(framework as ValidFramework)
      ? (framework as ValidFramework)
      : ('static' as const);

    const adapter = getAdapter(fw);
    const screens = generatedScreens
      .filter((s) => s.html && s.file)
      .map((s, i) => ({
        screenId: `workflow-${i}`,
        route: inferRoute(s.name, i),
        name: s.name,
        html: s.html,
      }));

    if (screens.length === 0) {
      log.error('No valid screens to build. Aborting build step.');
    } else {
      const result = await adapter.build({
        projectId: 'workflow',
        outputDir: 'dist',
        screens,
      });

      log.success(`Site built: ${result.files.length} file(s) generated.`);
      for (const instruction of result.instructions) {
        log.info(`  ${instruction}`);
      }
    }
  } catch (err) {
    log.error(`Build failed: ${err instanceof Error ? err.message : 'unknown error'}`);
  }

  // ── Step 5: Final Validation ────────────────────────────────────
  currentStep++;
  log.step(currentStep, totalSteps, 'Running final validation...');

  log.info('');
  log.info('=== Workflow Summary ===');
  log.info(`  Workflow: ${workflow.name}`);
  log.info(`  Screens generated: ${generatedScreens.length}`);
  log.info(`  Screens passing: ${generatedScreens.filter((s) => s.validation.passed).length}/${generatedScreens.length}`);
  log.info('');

  const avgScore =
    generatedScreens.length > 0
      ? Math.round(
          generatedScreens.reduce((sum, s) => sum + s.validation.score, 0) /
            generatedScreens.length,
        )
      : 0;
  log.info(`  Average quality score: ${avgScore}/100`);

  if (avgScore >= 60) {
    log.success('All screens meet quality threshold. Workflow complete!');
  } else {
    log.warn('Some screens below quality threshold. Review generated files and consider:');
    log.info('  1. Editing DESIGN.md for better specificity');
    log.info('  2. Running `dg generate` on individual screens');
    log.info('  3. Providing competitor URLs for differentiation');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function countSteps(workflow: WorkflowDefinition, options: WorkflowOptions): number {
  let steps = 4; // design + generate + build + final validation
  if (options.url) steps += 1; // research
  return steps;
}

function buildScreenPrompt(page: WorkflowPageTemplate, designMd: string): string {
  // Truncate DESIGN.md if too long for prompt context
  const maxDesignChars = 3000;
  const designContext =
    designMd.length > maxDesignChars
      ? designMd.slice(0, maxDesignChars) + '\n\n[...truncated]'
      : designMd;

  return `${page.prompt}\n\nDesign system context:\n${designContext}`;
}

/**
 * Placeholder screen generator that creates a simple HTML page.
 * In production, this would call the Stitch MCP or Claude generator.
 */
async function generateScreen(prompt: string, generator: string): Promise<string> {
  // Try to use the actual generator adapters if available
  if (generator === 'stitch') {
    try {
      const { StitchMcpClient } = await import('../mcp/client.js');
      const client = new StitchMcpClient();
      const projects = await client.listProjects();
      if (projects.length > 0) {
        const result = await client.generateScreen(
          projects[0].id,
          prompt,
          'GEMINI_2_5_FLASH',
        );
        return await client.getScreenCode(
          projects[0].id,
          result.screenId,
          result.htmlCodeUrl,
        );
      }
    } catch {
      // Fall through to placeholder
    }
  }

  // Placeholder: generate a basic HTML page from the prompt
  const title = prompt.split('\n')[0].slice(0, 60);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
    .hero { padding: 80px 20px; text-align: center; background: #f5f5f5; }
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    .hero p { font-size: 1.125rem; color: #555; max-width: 600px; margin: 0 auto; }
    section { padding: 60px 20px; max-width: 1200px; margin: 0 auto; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>${escapeHtml(title)}</h1>
    <p>Generated by Design Guard workflow pipeline.</p>
  </section>
  <section>
    <h2>Content</h2>
    <p>This is a placeholder screen. Use the Stitch or Claude generator for production output.</p>
  </section>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inferRoute(name: string, index: number): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (index === 0 || /home|landing|hero|main/i.test(name)) return '/';
  return `/${normalized}`;
}
