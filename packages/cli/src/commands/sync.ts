import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { log } from '../utils/logger.js';
import { getConfig, updateConfig, type GeneratorType } from '../utils/config.js';
import { getGenerator } from '../generators/index.js';
import { StitchGenerator } from '../generators/stitch.js';

interface SyncOptions {
  generator?: string;
}

export async function runSync(projectId?: string, opts?: SyncOptions): Promise<void> {
  const config = getConfig();
  const id = projectId || config.projectId;
  const generatorName = (opts?.generator || config.generator || 'stitch') as GeneratorType;

  // Get generator
  let generator;
  try {
    generator = getGenerator(generatorName);
  } catch (err) {
    log.error(err instanceof Error ? err.message : 'Failed to create generator.');
    process.exit(1);
  }

  // Initialize
  try {
    await generator.initialize({ type: generatorName, projectId: id });
  } catch (err) {
    log.error(err instanceof Error ? err.message : `Failed to initialize ${generatorName} generator.`);
    process.exit(1);
  }

  if (!id) {
    if (generatorName === 'stitch') {
      // For Stitch, list projects to help user find their ID
      const { StitchMcpClient } = await import('../mcp/client.js');
      let client: InstanceType<typeof StitchMcpClient>;
      try {
        client = new StitchMcpClient();
      } catch (err) {
        log.error(err instanceof Error ? err.message : 'Failed to initialize Stitch client.');
        process.exit(1);
      }
      log.info('No project ID. Listing available projects...');
      const projects = await client.listProjects();
      if (projects.length === 0) {
        log.error('No projects found.');
        process.exit(1);
      }
      for (const p of projects) {
        log.info(`  ${p.id} -- ${p.name}`);
      }
      log.info('Run: dg sync <project-id>');
      return;
    } else if (generatorName === 'claude') {
      // Claude Direct uses local screens/ directory — list what we have
      const screens = await generator.listScreens('local');
      if (screens.length === 0) {
        log.info('No screens found in screens/ directory.');
      } else {
        log.info(`Found ${screens.length} local screen(s):`);
        for (const s of screens) {
          log.info(`  ${s.name}`);
        }
      }
      return;
    }
  }

  if (!existsSync('screens')) mkdirSync('screens');

  log.step(1, 2, 'Fetching screens...');
  const screens = await generator.listScreens(id!);

  log.step(2, 2, `Downloading ${screens.length} screens...`);
  const screenRecords = [];

  for (const screen of screens) {
    let html = screen.html;
    if (!html && generatorName === 'stitch') {
      // For Stitch, fetch the actual HTML code
      html = await generator.getScreenCode(screen.id);
    }
    const filename = `screens/${screen.name || screen.id}.html`;
    if (html) {
      writeFileSync(filename, html);
    }
    log.info(`  ${filename}`);

    screenRecords.push({
      id: screen.id,
      name: screen.name,
      lastSynced: new Date().toISOString(),
    });
  }

  updateConfig({
    projectId: id,
    screens: screenRecords,
    lastSync: new Date().toISOString(),
  });

  log.success(`Synced ${screens.length} screens from project.`);
}
