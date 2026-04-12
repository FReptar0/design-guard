import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { validatePrompt } from '@design-guard/core';
import { canGenerate, getQuotaStatus } from '../utils/quota.js';
import { getConfig, incrementQuota, type GeneratorType } from '../utils/config.js';
import { getGenerator } from '../generators/index.js';

interface GenerateOptions {
  model: string;
  project?: string;
  preview?: boolean;
  generator?: string;
}

export async function runGenerate(description: string, opts: GenerateOptions): Promise<void> {
  const config = getConfig();
  const generatorName = (opts.generator || config.generator || 'stitch') as GeneratorType;
  const model = opts.model === 'pro' ? 'GEMINI_3_PRO' as const : 'GEMINI_2_5_FLASH' as const;

  // Quota check only applies to Stitch generator
  if (generatorName === 'stitch') {
    if (!canGenerate(model)) {
      const status = getQuotaStatus();
      log.error(`No ${model} generations remaining. Resets ${status.resetDate}.`);
      process.exit(1);
    }
  }

  // Check for DESIGN.md
  const hasDesignMd = existsSync('DESIGN.md');
  if (!hasDesignMd) {
    log.warn('No DESIGN.md found. Screens may be inconsistent. Run `dg design` first.');
  }

  // Build prompt
  const prompt = description;

  // Validate
  const validation = validatePrompt(prompt);
  if (!validation.valid) {
    for (const error of validation.errors) {
      log.error(error);
    }
    process.exit(1);
  }

  // Get generator
  let generator;
  try {
    generator = getGenerator(generatorName);
  } catch (err) {
    log.error(err instanceof Error ? err.message : 'Failed to create generator.');
    process.exit(1);
  }

  // For Stitch, we need a project ID; for Claude Direct, we don't
  let projectId = opts.project || config.projectId;

  if (generatorName === 'stitch' && !projectId) {
    // Initialize Stitch and resolve project
    try {
      await generator.initialize({ type: 'stitch' });
    } catch (err) {
      log.error(err instanceof Error ? err.message : 'Failed to initialize Stitch generator.');
      process.exit(1);
    }

    // Fall back to MCP client for project listing
    const { StitchMcpClient } = await import('../mcp/client.js');
    let client: InstanceType<typeof StitchMcpClient>;
    try {
      client = new StitchMcpClient();
    } catch (err) {
      log.error(err instanceof Error ? err.message : 'Failed to initialize Stitch client.');
      process.exit(1);
    }

    log.info('No project ID specified. Listing projects...');
    let projects: Awaited<ReturnType<typeof client.listProjects>>;
    try {
      projects = await client.listProjects();
    } catch (err) {
      log.error(err instanceof Error ? err.message : 'Failed to list projects.');
      process.exit(1);
    }
    if (projects.length === 0) {
      log.error('No Stitch projects found. Create one at stitch.withgoogle.com first.');
      process.exit(1);
    }
    if (projects.length === 1) {
      projectId = projects[0].id;
      log.info(`Using project: ${projects[0].name} (${projectId})`);
    } else {
      log.info('Multiple projects found:');
      projects.forEach((p, i) => log.info(`  ${i + 1}. ${p.name} (${p.id})`));
      const rl = await import('node:readline');
      const iface = rl.createInterface({ input: process.stdin, output: process.stderr });
      const answer = await new Promise<string>(resolve => {
        iface.question(`Select project (1-${projects.length}): `, resolve);
      });
      iface.close();
      const idx = parseInt(answer) - 1;
      if (idx < 0 || idx >= projects.length) {
        log.error('Invalid selection.');
        process.exit(1);
      }
      projectId = projects[idx].id;
      log.info(`Using project: ${projects[idx].name} (${projectId})`);
    }
  }

  // Initialize generator with resolved config
  try {
    await generator.initialize({ type: generatorName, projectId, model });
  } catch (err) {
    log.error(err instanceof Error ? err.message : `Failed to initialize ${generatorName} generator.`);
    process.exit(1);
  }

  // Generate
  try {
    const designMd = hasDesignMd ? readFileSync('DESIGN.md', 'utf-8') : undefined;

    log.step(1, 2, `Generating screen via ${generator.name} (${model})...`);
    const screen = await generator.generateScreen(prompt, {
      designMd,
      model,
      screenName: undefined,
    });

    log.step(2, 2, 'Saving...');
    if (!existsSync('screens')) mkdirSync('screens');
    const filename = `screens/${screen.name || screen.id}.html`;

    // Only write HTML file if we got actual HTML (not a placeholder for Claude Direct prompts)
    if (screen.html && !screen.html.startsWith('<!-- Generation request saved')) {
      writeFileSync(filename, screen.html);
      log.success(`Screen saved: ${filename}`);
    } else {
      log.success(`Generation request created for ${generator.name}.`);
      if (screen.metadata?.promptPath) {
        log.info(`Prompt file: ${screen.metadata.promptPath}`);
      }
    }

    // Update quota for Stitch generator
    if (generatorName === 'stitch') {
      incrementQuota(model);
      const status = getQuotaStatus();
      log.quota(model, model === 'GEMINI_2_5_FLASH' ? status.flash.used : status.pro.used,
        model === 'GEMINI_2_5_FLASH' ? status.flash.limit : status.pro.limit);
    }

    if (opts.preview && screen.html && !screen.html.startsWith('<!-- Generation request saved')) {
      const { openInBrowser } = await import('../utils/preview.js');
      await openInBrowser(filename);
      log.info('Preview opened in browser.');
    }
  } catch (err) {
    log.error(err instanceof Error ? err.message : 'Generation failed.');
    process.exit(1);
  }
}
