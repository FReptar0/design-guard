# Phase 1: Extract Core IP into Monorepo

## Objective

Restructure the single-package `design-guard` project into an npm workspaces monorepo with two packages:

- **`@design-guard/core`** -- generator-agnostic design intelligence library (zero CLI deps)
- **`design-guard`** -- CLI/TUI tool that depends on `@design-guard/core`

All 121 existing tests must continue to pass after restructure. No functional changes.

---

## Current State (verified)

- 12 test files, 121 tests, all passing
- Single `package.json`, single `tsconfig.json`, single `vitest.config.ts`
- Mixed core and CLI code in flat `src/` tree
- `type: "module"` (ESM throughout, `.js` extensions in imports)

---

## Plan Overview

| Step | What | Est. Time |
|------|------|-----------|
| 1 | Create directory scaffold | 2 min |
| 2 | Create root workspace config files | 5 min |
| 3 | Create `packages/core/` package files | 10 min |
| 4 | Move core source files | 5 min |
| 5 | Create `packages/core/src/index.ts` public API barrel | 10 min |
| 6 | Fix internal imports within core | 15 min |
| 7 | Move core tests + fixtures | 5 min |
| 8 | Fix core test imports | 10 min |
| 9 | Create `packages/cli/` package files | 10 min |
| 10 | Move CLI source files | 5 min |
| 11 | Fix CLI imports (core references become `@design-guard/core`) | 20 min |
| 12 | Move CLI tests + remaining fixtures | 5 min |
| 13 | Fix CLI test imports | 10 min |
| 14 | Wire up vitest configs | 5 min |
| 15 | Install + build + test | 10 min |
| 16 | Clean up root leftovers | 5 min |
| **Total** | | **~2 hours** |

---

## Step 1: Create Directory Scaffold

```bash
mkdir -p packages/core/src/research
mkdir -p packages/core/src/validation
mkdir -p packages/core/src/templates
mkdir -p packages/core/src/utils
mkdir -p packages/core/tests/unit
mkdir -p packages/core/tests/fixtures
mkdir -p packages/cli/src/commands
mkdir -p packages/cli/src/mcp
mkdir -p packages/cli/src/tui/components
mkdir -p packages/cli/src/adapters
mkdir -p packages/cli/src/utils
mkdir -p packages/cli/tests/unit
mkdir -p packages/cli/tests/integration
mkdir -p packages/cli/tests/fixtures
```

---

## Step 2: Root Workspace Config Files

### Root `package.json` (REPLACE existing)

```json
{
  "name": "design-guard-monorepo",
  "private": true,
  "workspaces": [
    "packages/core",
    "packages/cli"
  ],
  "scripts": {
    "build": "npm run build --workspace=packages/core && npm run build --workspace=packages/cli",
    "test": "npm run test:run --workspaces",
    "test:run": "npm run test:run --workspaces",
    "test:core": "npm run test:run --workspace=packages/core",
    "test:cli": "npm run test:run --workspace=packages/cli",
    "typecheck": "npm run typecheck --workspaces",
    "clean": "rm -rf packages/core/dist packages/cli/dist"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "MIT",
  "author": "Fernando Rodriguez Memije <hi@fernandomemije.dev> (https://fernandomemije.dev)",
  "repository": {
    "type": "git",
    "url": "https://github.com/freptar0/design-guard.git"
  }
}
```

### Root `tsconfig.base.json` (NEW)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true
  }
}
```

### Root `tsconfig.json` (REPLACE existing -- project references only)

```json
{
  "files": [],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/cli" }
  ]
}
```

### Root `vitest.config.ts` -- DELETE

Each package gets its own vitest config. The root scripts delegate via `--workspaces`.

---

## Step 3: `packages/core/` Package Files

### `packages/core/package.json`

```json
{
  "name": "@design-guard/core",
  "version": "0.3.1",
  "description": "Design intelligence engine — business research, design synthesis, quality scoring, and anti-slop validation",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "cheerio": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.1.0",
    "@types/node": "^22.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "MIT",
  "author": "Fernando Rodriguez Memije <hi@fernandomemije.dev> (https://fernandomemije.dev)",
  "keywords": [
    "design-guard",
    "design-quality",
    "design-lint",
    "design-system",
    "design-intelligence",
    "anti-slop"
  ],
  "files": [
    "dist"
  ]
}
```

**NOTE on `node-fetch`**: The current code uses `cheerio` (which handles its own HTTP) and the `business-researcher.ts` uses global `fetch()` (available in Node 20+). The `node-fetch` dependency in the original `package.json` is not actually imported anywhere in the core files -- they all use the built-in `fetch`. So `node-fetch` is NOT needed in `@design-guard/core`. If a runtime below Node 18 is ever needed, it can be added back.

### `packages/core/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### `packages/core/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
    },
  },
});
```

---

## Step 4: Move Core Source Files

Every `git mv` below. Source -> Destination.

### Research module

| Source | Destination | Notes |
|--------|------------|-------|
| `src/research/types.ts` | `packages/core/src/research/types.ts` | Shared types for entire core |
| `src/research/business-researcher.ts` | `packages/core/src/research/business-researcher.ts` | Core IP |
| `src/research/design-synthesizer.ts` | `packages/core/src/research/design-synthesizer.ts` | Core IP |
| `src/research/research-cache.ts` | `packages/core/src/research/research-cache.ts` | Core utility |

### Validation module (renamed from scattered locations)

| Source | Destination | Notes |
|--------|------------|-------|
| `src/utils/design-validator.ts` | `packages/core/src/validation/design-validator.ts` | Renamed directory |
| `src/utils/output-validator.ts` | `packages/core/src/validation/output-validator.ts` | Renamed directory |

### Templates module

| Source | Destination | Notes |
|--------|------------|-------|
| `src/templates/design-md.ts` | `packages/core/src/templates/design-md.ts` | |
| `src/templates/prompts.ts` | `packages/core/src/templates/prompts.ts` | |

### Utils module

| Source | Destination | Notes |
|--------|------------|-------|
| `src/utils/validators.ts` | `packages/core/src/utils/validators.ts` | Zod schemas + prompt validation |
| `src/utils/prompt-enhancer.ts` | `packages/core/src/utils/prompt-enhancer.ts` | |

**Total: 10 files move to core.**

```bash
# Research
git mv src/research/types.ts packages/core/src/research/types.ts
git mv src/research/business-researcher.ts packages/core/src/research/business-researcher.ts
git mv src/research/design-synthesizer.ts packages/core/src/research/design-synthesizer.ts
git mv src/research/research-cache.ts packages/core/src/research/research-cache.ts

# Validation (new directory name)
git mv src/utils/design-validator.ts packages/core/src/validation/design-validator.ts
git mv src/utils/output-validator.ts packages/core/src/validation/output-validator.ts

# Templates
git mv src/templates/design-md.ts packages/core/src/templates/design-md.ts
git mv src/templates/prompts.ts packages/core/src/templates/prompts.ts

# Utils
git mv src/utils/validators.ts packages/core/src/utils/validators.ts
git mv src/utils/prompt-enhancer.ts packages/core/src/utils/prompt-enhancer.ts
```

---

## Step 5: Create `packages/core/src/index.ts` (Public API Barrel)

This is the single entry point for `@design-guard/core`. Every consumer imports from here.

```ts
// ─── Research ──────────────────────────────────────────────────────
export { researchBusiness, analyzeSite, extractPalette, extractTypography, detectLayoutPatterns, inferBusinessModel, inferAudienceInsights, inferMarketPosition } from './research/business-researcher.js';
export { synthesizeDesign, synthesizePalette, synthesizeTypography, synthesizeImagery, synthesizeDosAndDonts, nameColor } from './research/design-synthesizer.js';
export { cacheResearch, getCachedResearch, cacheSiteAnalysis, getCachedSiteAnalysis, isCacheValid } from './research/research-cache.js';

// ─── Validation ────────────────────────────────────────────────────
export { scoreDesignMd, hexDistance, scoreSpecificity, scoreDifferentiation, scoreCompleteness, scoreActionability, checkCulturalAlignment, formatDesignQualityReport } from './validation/design-validator.js';
export { validateOutput, formatValidationReport } from './validation/output-validator.js';
export type { ValidationIssue, OutputValidationResult } from './validation/output-validator.js';

// ─── Templates ─────────────────────────────────────────────────────
export { generateDesignMdTemplate, matchIndustry, matchAesthetic, generateImageryGuidelines, generateDosAndDonts, INDUSTRY_PALETTES, AESTHETIC_MODIFIERS } from './templates/design-md.js';
export type { DesignBrief, IndustryPalette, AestheticModifier } from './templates/design-md.js';
export { buildInitialPrompt, buildRefinementPrompt, buildLocalePrompt, buildConsistencyPrefix } from './templates/prompts.js';
export type { ScreenSpec, RefinementSpec } from './templates/prompts.js';

// ─── Utils ─────────────────────────────────────────────────────────
export { validatePrompt, validateQuota, DesignMdSchema, ColorRoleSchema, PROMPT_MAX_CHARS } from './utils/validators.js';
export type { DesignMd } from './utils/validators.js';
export { enhancePrompt, calculateSlopRisk, getSlopRiskLevel } from './utils/prompt-enhancer.js';
export type { EnhancementResult } from './utils/prompt-enhancer.js';

// ─── Types ─────────────────────────────────────────────────────────
export type {
  BusinessBrief,
  BusinessModelContext,
  SiteAnalysis,
  ExtractedColor,
  ExtractedPalette,
  ExtractedTypography,
  CompetitorAnalysis,
  AudienceInsight,
  MarketPosition,
  BusinessResearchResult,
  DesignQualityIssue,
  DesignQualityScore,
  SynthesizedDesign,
} from './research/types.js';
```

---

## Step 6: Fix Internal Imports Within Core

After the move, the relative import paths inside core files change because `design-validator.ts` and `output-validator.ts` moved from `src/utils/` to `src/validation/`.

### `packages/core/src/research/design-synthesizer.ts`

**Line 22 changes:**

```diff
-import { scoreDesignMd } from '../utils/design-validator.js';
+import { scoreDesignMd } from '../validation/design-validator.js';
```

All other imports within `design-synthesizer.ts` are relative to `./types.js` and `../templates/design-md.js` which stay at the same relative positions. No change needed.

### `packages/core/src/validation/design-validator.ts`

**Line 8-13 changes:**

```diff
-import type {
-  BusinessResearchResult,
-  CompetitorAnalysis,
-  DesignQualityIssue,
-  DesignQualityScore,
-} from '../research/types.js';
+import type {
+  BusinessResearchResult,
+  CompetitorAnalysis,
+  DesignQualityIssue,
+  DesignQualityScore,
+} from '../research/types.js';
```

The relative path `../research/types.js` is the SAME from both `src/utils/` and `src/validation/` (both are one level under `src/`). **No change needed.**

### `packages/core/src/validation/output-validator.ts`

Current imports: `cheerio` and `node:fs`. No internal imports. **No change needed.**

### `packages/core/src/research/business-researcher.ts`

Current imports: `cheerio` and `./types.js`. **No change needed** (same relative path).

### `packages/core/src/research/research-cache.ts`

Current imports: `node:fs`, `node:path`, `node:crypto`, `./types.js`. **No change needed.**

### `packages/core/src/templates/design-md.ts`

Current imports: none (fully self-contained). **No change needed.**

### `packages/core/src/templates/prompts.ts`

Current imports: none (fully self-contained). **No change needed.**

### `packages/core/src/utils/validators.ts`

Current imports: `zod`. **No change needed.**

### `packages/core/src/utils/prompt-enhancer.ts`

Current imports: `node:fs`. **No change needed.**

### Summary of core internal import fixes

Only ONE file needs a change:

| File | Old Import | New Import |
|------|-----------|------------|
| `packages/core/src/research/design-synthesizer.ts` | `../utils/design-validator.js` | `../validation/design-validator.js` |

---

## Step 7: Move Core Tests + Fixtures

| Source | Destination | Category |
|--------|------------|----------|
| `tests/unit/business-researcher.test.ts` | `packages/core/tests/unit/business-researcher.test.ts` | core |
| `tests/unit/design-synthesizer.test.ts` | `packages/core/tests/unit/design-synthesizer.test.ts` | core |
| `tests/unit/output-validator.test.ts` | `packages/core/tests/unit/output-validator.test.ts` | core |
| `tests/unit/prompt-enhancer.test.ts` | `packages/core/tests/unit/prompt-enhancer.test.ts` | core |
| `tests/unit/prompts.test.ts` | `packages/core/tests/unit/prompts.test.ts` | core |
| `tests/unit/validators.test.ts` | `packages/core/tests/unit/validators.test.ts` | core |
| `tests/unit/research.test.ts` | `packages/core/tests/unit/research.test.ts` | core (differ tests) |
| `tests/fixtures/business-site.html` | `packages/core/tests/fixtures/business-site.html` | core fixture |
| `tests/fixtures/competitor-site.html` | `packages/core/tests/fixtures/competitor-site.html` | core fixture |
| `tests/fixtures/sample-design.md` | `packages/core/tests/fixtures/sample-design.md` | shared -- copy to both |
| `tests/fixtures/screen-html.html` | `packages/cli/tests/fixtures/screen-html.html` | CLI fixture |
| `tests/fixtures/stitch-response.json` | `packages/cli/tests/fixtures/stitch-response.json` | CLI fixture |

```bash
# Core tests
git mv tests/unit/business-researcher.test.ts packages/core/tests/unit/
git mv tests/unit/design-synthesizer.test.ts packages/core/tests/unit/
git mv tests/unit/output-validator.test.ts packages/core/tests/unit/
git mv tests/unit/prompt-enhancer.test.ts packages/core/tests/unit/
git mv tests/unit/prompts.test.ts packages/core/tests/unit/
git mv tests/unit/validators.test.ts packages/core/tests/unit/
git mv tests/unit/research.test.ts packages/core/tests/unit/

# Core fixtures
git mv tests/fixtures/business-site.html packages/core/tests/fixtures/
git mv tests/fixtures/competitor-site.html packages/core/tests/fixtures/
cp tests/fixtures/sample-design.md packages/core/tests/fixtures/sample-design.md
```

---

## Step 8: Fix Core Test Imports

All core tests currently use `await import('../../src/...')` pattern. After the move to `packages/core/tests/`, the relative path to source changes.

**Old:** `../../src/research/business-researcher.js` (from `tests/unit/`)
**New:** `../../src/research/business-researcher.js` (from `packages/core/tests/unit/`)

The relative path from `packages/core/tests/unit/` to `packages/core/src/` is `../../src/` -- this is the SAME depth as before (`tests/unit/` -> `../../src/`). **No import path changes needed in core tests.**

### Special case: `research.test.ts`

This test imports from `../../src/research/differ.js` and `../../src/research/crawler.js`.

**Problem:** `differ.ts` and `crawler.ts` are Stitch-specific research tools (crawling Stitch docs, diffing against known-state.json). They are NOT part of the core design intelligence. They belong to the CLI package.

**Decision:** Move `crawler.ts`, `differ.ts`, `updater.ts`, and `known-state.json` to the CLI package under `packages/cli/src/research/`. The `research.test.ts` file also moves to CLI.

**REVISED Step 7 -- `research.test.ts` moves to CLI:**

| Source | Destination | Category |
|--------|------------|----------|
| `tests/unit/research.test.ts` | `packages/cli/tests/unit/research.test.ts` | CLI (tests differ.ts) |

And the Stitch-specific research files move in Step 10 (CLI source):

| Source | Destination |
|--------|------------|
| `src/research/crawler.ts` | `packages/cli/src/research/crawler.ts` |
| `src/research/differ.ts` | `packages/cli/src/research/differ.ts` |
| `src/research/updater.ts` | `packages/cli/src/research/updater.ts` |
| `src/research/known-state.json` | `packages/cli/src/research/known-state.json` |

---

## Step 9: `packages/cli/` Package Files

### `packages/cli/package.json`

```json
{
  "name": "design-guard",
  "version": "0.3.1",
  "description": "Design Guard -- CLI framework for automating web design with Google Stitch MCP",
  "type": "module",
  "bin": {
    "design-guard": "./dist/index.js",
    "dg": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc && cp src/research/known-state.json dist/research/known-state.json",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build && npm run test:run"
  },
  "dependencies": {
    "@design-guard/core": "workspace:*",
    "commander": "^12.1.0",
    "ink": "^5.1.0",
    "ink-text-input": "^6.0.0",
    "ink-select-input": "^6.0.0",
    "ink-spinner": "^5.0.0",
    "ink-table": "^3.1.0",
    "react": "^18.3.1",
    "chalk": "^5.3.0",
    "cheerio": "^1.0.0",
    "dotenv": "^16.4.0",
    "conf": "^13.0.0",
    "ora": "^8.1.0",
    "boxen": "^8.0.0",
    "figures": "^6.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.1.0",
    "@types/react": "^18.3.0",
    "@types/node": "^22.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "license": "MIT",
  "author": "Fernando Rodriguez Memije <hi@fernandomemije.dev> (https://fernandomemije.dev)",
  "repository": {
    "type": "git",
    "url": "https://github.com/freptar0/design-guard.git"
  },
  "homepage": "https://github.com/freptar0/design-guard#readme",
  "bugs": {
    "url": "https://github.com/freptar0/design-guard/issues"
  },
  "keywords": [
    "design-guard",
    "stitch",
    "google-stitch",
    "mcp",
    "web-design",
    "cli",
    "ai-design",
    "claude-code"
  ],
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

**NOTE on `cheerio`:** The CLI package still needs `cheerio` because `src/adapters/nextjs.ts` and `src/adapters/static.ts` import `* as cheerio from 'cheerio'` directly, and `src/research/crawler.ts` also uses it. This is a separate usage from core's usage. Both packages legitimately depend on it.

### `packages/cli/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"],
  "references": [
    { "path": "../core" }
  ]
}
```

### `packages/cli/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/tui/**'],
    },
  },
});
```

---

## Step 10: Move CLI Source Files

| Source | Destination |
|--------|------------|
| `src/index.ts` | `packages/cli/src/index.ts` |
| `src/commands/init.ts` | `packages/cli/src/commands/init.ts` |
| `src/commands/design.ts` | `packages/cli/src/commands/design.ts` |
| `src/commands/discover.ts` | `packages/cli/src/commands/discover.ts` |
| `src/commands/generate.ts` | `packages/cli/src/commands/generate.ts` |
| `src/commands/build.ts` | `packages/cli/src/commands/build.ts` |
| `src/commands/preview.ts` | `packages/cli/src/commands/preview.ts` |
| `src/commands/sync.ts` | `packages/cli/src/commands/sync.ts` |
| `src/commands/research.ts` | `packages/cli/src/commands/research.ts` |
| `src/commands/workflow.ts` | `packages/cli/src/commands/workflow.ts` |
| `src/mcp/client.ts` | `packages/cli/src/mcp/client.ts` |
| `src/mcp/tools.ts` | `packages/cli/src/mcp/tools.ts` |
| `src/mcp/auth.ts` | `packages/cli/src/mcp/auth.ts` |
| `src/tui/App.tsx` | `packages/cli/src/tui/App.tsx` |
| `src/tui/Dashboard.tsx` | `packages/cli/src/tui/Dashboard.tsx` |
| `src/tui/DesignEditor.tsx` | `packages/cli/src/tui/DesignEditor.tsx` |
| `src/tui/PromptBuilder.tsx` | `packages/cli/src/tui/PromptBuilder.tsx` |
| `src/tui/components/ScreenCard.tsx` | `packages/cli/src/tui/components/ScreenCard.tsx` |
| `src/tui/components/QuotaMeter.tsx` | `packages/cli/src/tui/components/QuotaMeter.tsx` |
| `src/tui/components/StatusBar.tsx` | `packages/cli/src/tui/components/StatusBar.tsx` |
| `src/tui/components/Spinner.tsx` | `packages/cli/src/tui/components/Spinner.tsx` |
| `src/adapters/index.ts` | `packages/cli/src/adapters/index.ts` |
| `src/adapters/types.ts` | `packages/cli/src/adapters/types.ts` |
| `src/adapters/astro.ts` | `packages/cli/src/adapters/astro.ts` |
| `src/adapters/static.ts` | `packages/cli/src/adapters/static.ts` |
| `src/adapters/nextjs.ts` | `packages/cli/src/adapters/nextjs.ts` |
| `src/utils/config.ts` | `packages/cli/src/utils/config.ts` |
| `src/utils/logger.ts` | `packages/cli/src/utils/logger.ts` |
| `src/utils/quota.ts` | `packages/cli/src/utils/quota.ts` |
| `src/utils/preview.ts` | `packages/cli/src/utils/preview.ts` |
| `src/templates/workflows.ts` | `packages/cli/src/templates/workflows.ts` |
| `src/research/crawler.ts` | `packages/cli/src/research/crawler.ts` |
| `src/research/differ.ts` | `packages/cli/src/research/differ.ts` |
| `src/research/updater.ts` | `packages/cli/src/research/updater.ts` |
| `src/research/known-state.json` | `packages/cli/src/research/known-state.json` |

**Total: 35 files move to CLI.**

```bash
# CLI entry
git mv src/index.ts packages/cli/src/index.ts

# Commands
git mv src/commands/init.ts packages/cli/src/commands/
git mv src/commands/design.ts packages/cli/src/commands/
git mv src/commands/discover.ts packages/cli/src/commands/
git mv src/commands/generate.ts packages/cli/src/commands/
git mv src/commands/build.ts packages/cli/src/commands/
git mv src/commands/preview.ts packages/cli/src/commands/
git mv src/commands/sync.ts packages/cli/src/commands/
git mv src/commands/research.ts packages/cli/src/commands/
git mv src/commands/workflow.ts packages/cli/src/commands/

# MCP
git mv src/mcp/client.ts packages/cli/src/mcp/
git mv src/mcp/tools.ts packages/cli/src/mcp/
git mv src/mcp/auth.ts packages/cli/src/mcp/

# TUI
git mv src/tui/App.tsx packages/cli/src/tui/
git mv src/tui/Dashboard.tsx packages/cli/src/tui/
git mv src/tui/DesignEditor.tsx packages/cli/src/tui/
git mv src/tui/PromptBuilder.tsx packages/cli/src/tui/
git mv src/tui/components/ScreenCard.tsx packages/cli/src/tui/components/
git mv src/tui/components/QuotaMeter.tsx packages/cli/src/tui/components/
git mv src/tui/components/StatusBar.tsx packages/cli/src/tui/components/
git mv src/tui/components/Spinner.tsx packages/cli/src/tui/components/

# Adapters
git mv src/adapters/index.ts packages/cli/src/adapters/
git mv src/adapters/types.ts packages/cli/src/adapters/
git mv src/adapters/astro.ts packages/cli/src/adapters/
git mv src/adapters/static.ts packages/cli/src/adapters/
git mv src/adapters/nextjs.ts packages/cli/src/adapters/

# CLI utils
git mv src/utils/config.ts packages/cli/src/utils/
git mv src/utils/logger.ts packages/cli/src/utils/
git mv src/utils/quota.ts packages/cli/src/utils/
git mv src/utils/preview.ts packages/cli/src/utils/

# CLI templates
git mv src/templates/workflows.ts packages/cli/src/templates/

# Stitch research (CLI-specific)
git mv src/research/crawler.ts packages/cli/src/research/
git mv src/research/differ.ts packages/cli/src/research/
git mv src/research/updater.ts packages/cli/src/research/
git mv src/research/known-state.json packages/cli/src/research/
```

---

## Step 11: Fix CLI Imports

This is the biggest step. Every CLI file that imported from a core module must now import from `@design-guard/core` instead of relative paths.

### `packages/cli/src/commands/design.ts`

```diff
-import { generateDesignMdTemplate, type DesignBrief } from '../templates/design-md.js';
+import { generateDesignMdTemplate, type DesignBrief } from '@design-guard/core';
```

### `packages/cli/src/commands/discover.ts`

```diff
-import { researchBusiness } from '../research/business-researcher.js';
-import { synthesizeDesign } from '../research/design-synthesizer.js';
-import { cacheResearch } from '../research/research-cache.js';
-import { formatDesignQualityReport } from '../utils/design-validator.js';
-import type { BusinessBrief } from '../research/types.js';
+import { researchBusiness, synthesizeDesign, cacheResearch, formatDesignQualityReport } from '@design-guard/core';
+import type { BusinessBrief } from '@design-guard/core';
```

### `packages/cli/src/commands/generate.ts`

```diff
-import { validatePrompt } from '../utils/validators.js';
-import { buildInitialPrompt, type ScreenSpec } from '../templates/prompts.js';
+import { validatePrompt, buildInitialPrompt } from '@design-guard/core';
+import type { ScreenSpec } from '@design-guard/core';
```

(The imports from `../utils/quota.js`, `../utils/config.js`, `../mcp/client.js` stay as-is -- they are CLI-internal.)

### `packages/cli/src/commands/workflow.ts`

No change. Imports only from `../utils/logger.js` (CLI) and `../templates/workflows.js` (CLI).

### `packages/cli/src/commands/research.ts`

No change. Imports only from CLI modules (`../utils/logger.js`, `../research/crawler.js`, `../research/differ.js`, `../research/updater.js`).

### `packages/cli/src/commands/init.ts`

No change. Imports only from CLI modules.

### `packages/cli/src/commands/build.ts`

No change. Imports only from CLI modules.

### `packages/cli/src/commands/sync.ts`

No change. Imports only from CLI modules.

### `packages/cli/src/commands/preview.ts`

No change. Imports only from CLI modules.

### `packages/cli/src/tui/App.tsx`

No change. Imports from `../research/crawler.js`, `../research/differ.js`, `../research/updater.js` are CLI-side research files. All other imports are CLI-internal.

### `packages/cli/src/tui/PromptBuilder.tsx`

```diff
-import { buildInitialPrompt, type ScreenSpec } from '../templates/prompts.js';
-import { validatePrompt } from '../utils/validators.js';
+import { buildInitialPrompt, validatePrompt } from '@design-guard/core';
+import type { ScreenSpec } from '@design-guard/core';
```

### `packages/cli/src/tui/Dashboard.tsx`

No change. Imports only from CLI modules.

### `packages/cli/src/tui/DesignEditor.tsx`

No change. Imports only from CLI modules and `node:fs`.

### `packages/cli/src/tui/components/*`

No change. All components import only from `ink`, `ink-spinner`, `react`.

### `packages/cli/src/adapters/*`

No change. All adapters import from CLI-internal `./types.js` and `cheerio`. The `astro.ts` imports from `../mcp/client.js` (CLI-internal).

### `packages/cli/src/mcp/client.ts`

No change. Imports only from `../utils/config.js` (CLI-internal).

### `packages/cli/src/mcp/tools.ts`

No change. No imports from other project files.

### `packages/cli/src/mcp/auth.ts`

No change. Imports only `node:fs` and `node:path`.

### `packages/cli/src/utils/config.ts`

No change. Imports only `node:fs` and `node:path`.

### `packages/cli/src/utils/logger.ts`

No change. Imports only `chalk`.

### `packages/cli/src/utils/quota.ts`

No change. Imports only from `./config.js` (CLI-internal).

### `packages/cli/src/utils/preview.ts`

No change. Imports only from `node:*` and `./logger.js` (CLI-internal).

### `packages/cli/src/templates/workflows.ts`

No change. No imports from other project files.

### `packages/cli/src/research/crawler.ts`

No change. Imports only `cheerio`.

### `packages/cli/src/research/differ.ts`

No change. Imports only from `./crawler.js` (CLI-internal research).

### `packages/cli/src/research/updater.ts`

No change. Imports only from `node:*` and `./differ.js`.

### Summary of CLI import changes

| File | What Changes |
|------|-------------|
| `packages/cli/src/commands/design.ts` | `../templates/design-md.js` -> `@design-guard/core` |
| `packages/cli/src/commands/discover.ts` | 5 imports consolidated to `@design-guard/core` |
| `packages/cli/src/commands/generate.ts` | `../utils/validators.js` + `../templates/prompts.js` -> `@design-guard/core` |
| `packages/cli/src/tui/PromptBuilder.tsx` | `../templates/prompts.js` + `../utils/validators.js` -> `@design-guard/core` |

**Only 4 files need import changes.** Everything else is CLI-internal.

---

## Step 12: Move CLI Tests + Remaining Fixtures

| Source | Destination |
|--------|------------|
| `tests/unit/adapters.test.ts` | `packages/cli/tests/unit/adapters.test.ts` |
| `tests/unit/quota.test.ts` | `packages/cli/tests/unit/quota.test.ts` |
| `tests/unit/mcp-retry.test.ts` | `packages/cli/tests/unit/mcp-retry.test.ts` |
| `tests/unit/preview.test.ts` | `packages/cli/tests/unit/preview.test.ts` |
| `tests/unit/research.test.ts` | `packages/cli/tests/unit/research.test.ts` |
| `tests/integration/mcp-client.test.ts` | `packages/cli/tests/integration/mcp-client.test.ts` |
| `tests/fixtures/sample-design.md` | `packages/cli/tests/fixtures/sample-design.md` |
| `tests/fixtures/screen-html.html` | `packages/cli/tests/fixtures/screen-html.html` |
| `tests/fixtures/stitch-response.json` | `packages/cli/tests/fixtures/stitch-response.json` |

```bash
git mv tests/unit/adapters.test.ts packages/cli/tests/unit/
git mv tests/unit/quota.test.ts packages/cli/tests/unit/
git mv tests/unit/mcp-retry.test.ts packages/cli/tests/unit/
git mv tests/unit/preview.test.ts packages/cli/tests/unit/
git mv tests/unit/research.test.ts packages/cli/tests/unit/
git mv tests/integration/mcp-client.test.ts packages/cli/tests/integration/
git mv tests/fixtures/sample-design.md packages/cli/tests/fixtures/
git mv tests/fixtures/screen-html.html packages/cli/tests/fixtures/
git mv tests/fixtures/stitch-response.json packages/cli/tests/fixtures/
```

---

## Step 13: Fix CLI Test Imports

### Tests that use dynamic `await import()` from source

These tests use `await import('../../src/...')`. Check if the relative path still holds from `packages/cli/tests/unit/` to `packages/cli/src/`:

- `../../src/` from `packages/cli/tests/unit/` resolves to `packages/cli/src/` -- **correct, no change needed** for tests that import CLI modules.

### `packages/cli/tests/unit/research.test.ts`

Currently imports from `../../src/research/differ.js` and `../../src/research/crawler.js`. After move, this resolves to `packages/cli/src/research/differ.js` which is correct. **No change needed.**

### `packages/cli/tests/unit/adapters.test.ts`

Currently imports from `../../src/adapters/types.js`. After move, resolves to `packages/cli/src/adapters/types.js`. **No change needed.**

### `packages/cli/tests/unit/mcp-retry.test.ts`

Uses dynamic imports. Check what it imports.

The test uses `await import('../../src/mcp/client.js')` pattern. After move, `packages/cli/tests/unit/` -> `../../src/mcp/client.js` = `packages/cli/src/mcp/client.js`. **No change needed.**

### `packages/cli/tests/unit/quota.test.ts`

Uses `await import('../../src/utils/quota.js')`. Resolves correctly. **No change needed.**

### `packages/cli/tests/unit/preview.test.ts`

Uses mock imports. Check what modules it mocks.

Current mocks reference `../../src/utils/preview.js` and `../../src/utils/logger.js`. These resolve correctly after the move. **No change needed.**

### `packages/cli/tests/integration/mcp-client.test.ts`

Currently at `tests/integration/`. After move to `packages/cli/tests/integration/`. Path `../../src/mcp/client.js` resolves to `packages/cli/src/mcp/client.js`. **No change needed.**

### Fixture path check in tests

Some tests reference `tests/fixtures/`. After the move, the path from `packages/cli/tests/unit/` to `packages/cli/tests/fixtures/` is `../fixtures/`. Check actual fixture references.

```bash
grep -rn "fixtures" tests/unit/adapters.test.ts tests/integration/mcp-client.test.ts
```

The `adapters.test.ts` file uses `readFileSync` with path joining. The `mcp-client.test.ts` uses `__dirname` + relative path. Both need to be checked, but since the relative positions of `tests/unit/` and `tests/fixtures/` are preserved (both under `packages/cli/tests/`), the paths should work.

**Summary: Zero test import changes needed for CLI tests.**

---

## Step 14: Wire Up Vitest Configs

Each package already has its own `vitest.config.ts` (created in Steps 3 and 9).

The root `vitest.config.ts` should be DELETED (done in Step 2).

The root `package.json` scripts use `--workspaces` to delegate:

```json
"test:run": "npm run test:run --workspaces"
```

This runs `vitest run` in each package sequentially (core first due to workspace order).

---

## Step 15: Install + Build + Test

```bash
# 1. Remove old node_modules and lockfile (clean slate for workspaces)
rm -rf node_modules package-lock.json

# 2. Install with workspace resolution
npm install

# 3. Build core first (cli depends on it)
npm run build --workspace=packages/core

# 4. Build cli
npm run build --workspace=packages/cli

# 5. Run all tests
npm run test:run

# Expected: 121 tests passing across both packages
```

### Build order

1. `@design-guard/core` -- no dependencies on other workspace packages
2. `design-guard` (CLI) -- depends on `@design-guard/core` via `workspace:*`

TypeScript project references (`"references": [{ "path": "../core" }]` in CLI tsconfig) ensure `tsc -b` from root builds in correct order.

---

## Step 16: Clean Up Root Leftovers

After all moves, these root directories/files should be empty or removed:

```bash
# Remove now-empty source directories
rm -rf src/
rm -rf tests/

# Remove old root vitest config (replaced by per-package)
rm -f vitest.config.ts

# Keep at root (NOT moved):
# - .claude/           (Claude Code skills -- project-level, not package-level)
# - docs/              (project documentation)
# - public/            (landing page assets)
# - scripts/           (repo scripts like demo.tape)
# - README.md
# - LICENSE
# - DESIGN.md
# - CLAUDE.md
# - .github/
# - .gitignore
# - .env.example
```

---

## Dependency Analysis

### Core package dependency graph (internal)

```
types.ts  <───────────── business-researcher.ts (imports types)
   ^                     
   │                     
   ├──────────────────── design-synthesizer.ts (imports types)
   │                          │
   │                          ├── imports design-md.ts (templates)
   │                          └── imports design-validator.ts (validation)
   │
   ├──────────────────── design-validator.ts (imports types)
   │
   └──────────────────── research-cache.ts (imports types)

validators.ts ──────────── standalone (only imports zod)
prompt-enhancer.ts ─────── standalone (only imports node:fs)
output-validator.ts ────── standalone (only imports cheerio, node:fs)
design-md.ts ──────────── standalone (no imports)
prompts.ts ────────────── standalone (no imports)
```

**No circular dependencies.** The dependency flows in one direction: types -> modules -> higher-level modules.

### CLI -> Core dependency graph

```
@design-guard/core
       │
       ├── commands/design.ts        (generateDesignMdTemplate, DesignBrief)
       ├── commands/discover.ts      (researchBusiness, synthesizeDesign, cacheResearch, 
       │                              formatDesignQualityReport, BusinessBrief)
       ├── commands/generate.ts      (validatePrompt, buildInitialPrompt, ScreenSpec)
       └── tui/PromptBuilder.tsx     (buildInitialPrompt, validatePrompt, ScreenSpec)
```

Only 4 CLI files import from core. All other CLI files are self-contained.

---

## Potential Issues & Mitigations

### 1. `workspace:*` protocol

npm workspaces support `workspace:*` natively since npm 8. The project requires Node 20+ which ships with npm 9+. No issue.

### 2. `known-state.json` runtime path

`updater.ts` uses `import.meta.url` to find `known-state.json` at runtime:

```ts
const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWN_STATE_PATH = join(__dirname, 'known-state.json');
```

After the move to `packages/cli/src/research/updater.ts`, the `known-state.json` is at `packages/cli/src/research/known-state.json`. The `cp` in the build script copies it to `dist/research/known-state.json`. At runtime, `import.meta.url` resolves to the `dist/` location, so `known-state.json` is found. **No issue.**

### 3. Tests that mock `node:fs`

Several tests (design-synthesizer, output-validator, prompt-enhancer, quota) mock `node:fs`. The mocking is done via `vi.mock('node:fs', ...)` which works at the module level regardless of directory. **No issue.**

### 4. `tsx` dev mode

The root `package.json` had `"dev": "tsx src/index.ts tui"`. This should move to the CLI package:

```json
// packages/cli/package.json scripts
"dev": "tsx src/index.ts tui"
```

And the root can optionally add:

```json
"dev": "npm run dev --workspace=packages/cli"
```

### 5. `eslint` config

The root `package.json` had `"lint": "eslint src/ tests/"`. This needs to change to:

```json
"lint": "eslint packages/"
```

Or each package can have its own lint script.

### 6. `.claude/skills` in published files

The original `package.json` had `"files": ["dist", ".claude/skills", ...]`. The `.claude/` directory stays at root, so the CLI package's `"files"` should reference it properly if skills should be published with the CLI package. Since the CLI `package.json` only lists `["dist", "README.md", "LICENSE"]`, skills are NOT published with the CLI. If skills should be published, add `"../../.claude/skills"` to the CLI's `files` array -- but npm may not follow paths outside the package root. This would need a copy step in the build script. **Defer this to a separate decision.**

---

## Files Summary

### Files that move to `packages/core/src/` (10 files)

1. `src/research/types.ts` -> `packages/core/src/research/types.ts`
2. `src/research/business-researcher.ts` -> `packages/core/src/research/business-researcher.ts`
3. `src/research/design-synthesizer.ts` -> `packages/core/src/research/design-synthesizer.ts`
4. `src/research/research-cache.ts` -> `packages/core/src/research/research-cache.ts`
5. `src/utils/design-validator.ts` -> `packages/core/src/validation/design-validator.ts`
6. `src/utils/output-validator.ts` -> `packages/core/src/validation/output-validator.ts`
7. `src/templates/design-md.ts` -> `packages/core/src/templates/design-md.ts`
8. `src/templates/prompts.ts` -> `packages/core/src/templates/prompts.ts`
9. `src/utils/validators.ts` -> `packages/core/src/utils/validators.ts`
10. `src/utils/prompt-enhancer.ts` -> `packages/core/src/utils/prompt-enhancer.ts`

### Files that move to `packages/cli/src/` (35 files)

1. `src/index.ts` -> `packages/cli/src/index.ts`
2. `src/commands/init.ts` -> `packages/cli/src/commands/init.ts`
3. `src/commands/design.ts` -> `packages/cli/src/commands/design.ts`
4. `src/commands/discover.ts` -> `packages/cli/src/commands/discover.ts`
5. `src/commands/generate.ts` -> `packages/cli/src/commands/generate.ts`
6. `src/commands/build.ts` -> `packages/cli/src/commands/build.ts`
7. `src/commands/preview.ts` -> `packages/cli/src/commands/preview.ts`
8. `src/commands/sync.ts` -> `packages/cli/src/commands/sync.ts`
9. `src/commands/research.ts` -> `packages/cli/src/commands/research.ts`
10. `src/commands/workflow.ts` -> `packages/cli/src/commands/workflow.ts`
11. `src/mcp/client.ts` -> `packages/cli/src/mcp/client.ts`
12. `src/mcp/tools.ts` -> `packages/cli/src/mcp/tools.ts`
13. `src/mcp/auth.ts` -> `packages/cli/src/mcp/auth.ts`
14. `src/tui/App.tsx` -> `packages/cli/src/tui/App.tsx`
15. `src/tui/Dashboard.tsx` -> `packages/cli/src/tui/Dashboard.tsx`
16. `src/tui/DesignEditor.tsx` -> `packages/cli/src/tui/DesignEditor.tsx`
17. `src/tui/PromptBuilder.tsx` -> `packages/cli/src/tui/PromptBuilder.tsx`
18. `src/tui/components/ScreenCard.tsx` -> `packages/cli/src/tui/components/ScreenCard.tsx`
19. `src/tui/components/QuotaMeter.tsx` -> `packages/cli/src/tui/components/QuotaMeter.tsx`
20. `src/tui/components/StatusBar.tsx` -> `packages/cli/src/tui/components/StatusBar.tsx`
21. `src/tui/components/Spinner.tsx` -> `packages/cli/src/tui/components/Spinner.tsx`
22. `src/adapters/index.ts` -> `packages/cli/src/adapters/index.ts`
23. `src/adapters/types.ts` -> `packages/cli/src/adapters/types.ts`
24. `src/adapters/astro.ts` -> `packages/cli/src/adapters/astro.ts`
25. `src/adapters/static.ts` -> `packages/cli/src/adapters/static.ts`
26. `src/adapters/nextjs.ts` -> `packages/cli/src/adapters/nextjs.ts`
27. `src/utils/config.ts` -> `packages/cli/src/utils/config.ts`
28. `src/utils/logger.ts` -> `packages/cli/src/utils/logger.ts`
29. `src/utils/quota.ts` -> `packages/cli/src/utils/quota.ts`
30. `src/utils/preview.ts` -> `packages/cli/src/utils/preview.ts`
31. `src/templates/workflows.ts` -> `packages/cli/src/templates/workflows.ts`
32. `src/research/crawler.ts` -> `packages/cli/src/research/crawler.ts`
33. `src/research/differ.ts` -> `packages/cli/src/research/differ.ts`
34. `src/research/updater.ts` -> `packages/cli/src/research/updater.ts`
35. `src/research/known-state.json` -> `packages/cli/src/research/known-state.json`

### New files created (8 files)

1. `packages/core/package.json`
2. `packages/core/tsconfig.json`
3. `packages/core/vitest.config.ts`
4. `packages/core/src/index.ts` (barrel export)
5. `packages/cli/package.json`
6. `packages/cli/tsconfig.json`
7. `packages/cli/vitest.config.ts`
8. `tsconfig.base.json`

### Files modified in place (4 files)

1. Root `package.json` (replaced with workspace root)
2. Root `tsconfig.json` (replaced with project references only)
3. Root `vitest.config.ts` (deleted)
4. `packages/core/src/research/design-synthesizer.ts` (1 import path fix)

### CLI files with import changes (4 files)

1. `packages/cli/src/commands/design.ts`
2. `packages/cli/src/commands/discover.ts`
3. `packages/cli/src/commands/generate.ts`
4. `packages/cli/src/tui/PromptBuilder.tsx`

### Test files that move (12 files -- all of them)

Core tests (7):
1. `tests/unit/business-researcher.test.ts` -> `packages/core/tests/unit/`
2. `tests/unit/design-synthesizer.test.ts` -> `packages/core/tests/unit/`
3. `tests/unit/output-validator.test.ts` -> `packages/core/tests/unit/`
4. `tests/unit/prompt-enhancer.test.ts` -> `packages/core/tests/unit/`
5. `tests/unit/prompts.test.ts` -> `packages/core/tests/unit/`
6. `tests/unit/validators.test.ts` -> `packages/core/tests/unit/`

CLI tests (6):
7. `tests/unit/research.test.ts` -> `packages/cli/tests/unit/`
8. `tests/unit/adapters.test.ts` -> `packages/cli/tests/unit/`
9. `tests/unit/quota.test.ts` -> `packages/cli/tests/unit/`
10. `tests/unit/mcp-retry.test.ts` -> `packages/cli/tests/unit/`
11. `tests/unit/preview.test.ts` -> `packages/cli/tests/unit/`
12. `tests/integration/mcp-client.test.ts` -> `packages/cli/tests/integration/`

### Test import changes needed: ZERO

All test files use `../../src/` relative paths which resolve correctly from `packages/{core,cli}/tests/unit/` to `packages/{core,cli}/src/`.

---

## Verification Checklist

After completing all steps, verify:

- [ ] `npm run build` succeeds (both packages)
- [ ] `npm run test:run` passes 121 tests across both packages
- [ ] `npm run typecheck` passes in both packages
- [ ] `npx design-guard --help` works (from root, using workspace resolution)
- [ ] `packages/core/package.json` has ZERO dependencies on: commander, ink, react, chalk, ora, conf, boxen, figures, dotenv
- [ ] `packages/core/src/index.ts` exports: researchBusiness, synthesizeDesign, validateOutput, scoreDesignMd, generateDesignMdTemplate, validatePrompt, enhancePrompt, and all types
- [ ] No files remain in root `src/` or root `tests/`
- [ ] `git status` shows clean working tree after commit

---

## Execution Order Summary

```
1. mkdir scaffold
2. Write root package.json, tsconfig.base.json, tsconfig.json
3. Write packages/core/package.json, tsconfig.json, vitest.config.ts
4. git mv 10 core source files
5. Create packages/core/src/index.ts barrel
6. Fix 1 import in design-synthesizer.ts
7. git mv 7 core test files + 2 core fixtures, cp 1 shared fixture
8. (no test import changes needed)
9. Write packages/cli/package.json, tsconfig.json, vitest.config.ts
10. git mv 35 CLI source files
11. Fix 4 CLI files' imports to use @design-guard/core
12. git mv 6 CLI test files + 3 CLI fixtures
13. (no test import changes needed)
14. Delete root vitest.config.ts
15. rm -rf node_modules package-lock.json && npm install && npm run build && npm run test:run
16. rm -rf src/ tests/ (empty directories)
17. git add -A && git commit
```
