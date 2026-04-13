---
phase: phase1-skill-flow-fixes
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/cli/src/utils/advisor.ts
  - .claude/skills/dg-design/SKILL.md
  - packages/cli/tests/unit/advisor.test.ts
autonomous: true
requirements: [SF-01]

must_haves:
  truths:
    - "When no DESIGN.md AND no .dg-research/ directory exist, advisor suggests /dg-discover (not /dg-design)"
    - "When no DESIGN.md but .dg-research/ exists with JSON files, advisor suggests /dg-design"
    - "When DESIGN.md exists, advisor does not suggest /dg-discover or /dg-design as blocker"
    - "dg-design skill checks for .dg-research/ and mentions a business name before proceeding"
  artifacts:
    - path: "packages/cli/src/utils/advisor.ts"
      provides: "Research-aware advisor hints"
      contains: "dg-research"
    - path: ".claude/skills/dg-design/SKILL.md"
      provides: "Discover preamble check in design skill"
      contains: "dg-discover"
    - path: "packages/cli/tests/unit/advisor.test.ts"
      provides: "Unit tests for advisor discover-first logic"
      contains: "dg-discover"
  key_links:
    - from: "packages/cli/src/utils/advisor.ts"
      to: ".dg-research/"
      via: "existsSync + readdirSync check"
      pattern: "dg-research"
    - from: ".claude/skills/dg-design/SKILL.md"
      to: ".dg-research/"
      via: "step 0 preamble instruction"
      pattern: "dg-research"
---

<objective>
Add discover-first awareness to the advisor and dg-design skill so that when a user
asks to design for a real business, the system suggests /dg-discover (research) before
/dg-design (generation).

Purpose: Prevents market-misaligned designs. The dogfood session showed that skipping
business research produced a DESIGN.md contaminated with host project data and visually
misaligned with the target market (cafe using Material Symbols, monospace prices).

Output: Updated advisor.ts with research-aware hint logic, updated dg-design SKILL.md
with discover preamble check, new advisor.test.ts covering both paths.
</objective>

<execution_context>
@/Users/freptar0/.claude/get-shit-done/workflows/execute-plan.md
@/Users/freptar0/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ws4-dogfood-fixes/ROADMAP.md
@.planning/ws4-dogfood-fixes/phase1-RESEARCH.md
@packages/cli/src/utils/advisor.ts
@packages/cli/src/utils/config.ts
@.claude/skills/dg-design/SKILL.md
@.claude/skills/dg-discover/SKILL.md

<interfaces>
<!-- Key types and contracts the executor needs. -->

From packages/cli/src/utils/advisor.ts:
```typescript
export type HintLevel = 'blocker' | 'warning' | 'ok' | 'info';

export interface Hint {
  level: HintLevel;
  message: string;
  action?: string;
}

export interface AdvisorReport {
  hints: Hint[];
  suggestedNext?: string;
}

export function getAdvisorReport(): AdvisorReport;
export function formatAdvisorLines(report: AdvisorReport): string[];
```

From packages/cli/src/utils/config.ts:
```typescript
export function configExists(): boolean;
export function getConfig(): StitchConfig;
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add advisor unit tests + research-aware hint logic</name>
  <files>packages/cli/tests/unit/advisor.test.ts, packages/cli/src/utils/advisor.ts</files>
  <behavior>
    - Test: When no DESIGN.md AND no .dg-research/ directory exist, getAdvisorReport() returns a blocker hint with action="/dg-discover" and message containing "research" or "discover"
    - Test: When no DESIGN.md but .dg-research/ exists with at least one .json file, getAdvisorReport() returns a blocker hint with action="/dg-design" (not /dg-discover)
    - Test: When .dg-research/ exists but is empty (no JSON files), getAdvisorReport() treats it as if research has NOT been done (suggests /dg-discover)
    - Test: When DESIGN.md exists (regardless of .dg-research/), no discover or design blocker is emitted
    - Test: suggestedNext reflects the correct action (/dg-discover or /dg-design) based on research state
  </behavior>
  <action>
    **RED phase -- write tests first:**

    Create `packages/cli/tests/unit/advisor.test.ts`. The advisor reads filesystem state via `existsSync`, `readdirSync`, `readFileSync`. Use `vi.mock('node:fs')` to mock these. Also mock `./config.js` and `./quota.js` since the advisor imports them.

    Test structure:
    ```
    describe('getAdvisorReport', () => {
      describe('discover-first logic', () => {
        test('suggests /dg-discover when no DESIGN.md and no .dg-research/')
        test('suggests /dg-design when no DESIGN.md but .dg-research/ has JSON files')
        test('suggests /dg-discover when .dg-research/ exists but empty')
        test('no design/discover blocker when DESIGN.md exists')
        test('suggestedNext is /dg-discover when research missing')
      })
    })
    ```

    Mock setup for each test:
    - `existsSync` returns true/false based on path (DESIGN.md, .dg-research, .guardrc.json, screens/, evaluations/)
    - `readdirSync` returns file lists for .dg-research/ (empty array or ['latest.json'])
    - `configExists` returns true (so quota check doesn't interfere)
    - `getQuotaStatus` returns a safe default

    **GREEN phase -- implement the logic:**

    In `advisor.ts`, add a helper function `researchExists()` that:
    1. Checks `existsSync(join(process.cwd(), '.dg-research'))`
    2. If directory exists, checks `readdirSync(dir).some(f => f.endsWith('.json'))`
    3. Returns true only if directory exists AND contains at least one JSON file

    Modify the DESIGN.md check (check 2, around line 93-101) to split into three cases:
    - `!hasDesign && !researchExists()` -> blocker with action `/dg-discover`, message: "No business research found. Run /dg-discover to research the business before designing."
    - `!hasDesign && researchExists()` -> blocker with action `/dg-design`, message: "DESIGN.md missing. Research exists — run /dg-design to generate from existing research."
    - `hasDesign` -> ok hint (existing behavior, unchanged)

    This replaces the current single `!hasDesign` check at lines 95-101.

    Important: The new discover hint MUST be a `blocker` level so it appears as `suggestedNext` (the priority logic at lines 180-183 selects first blocker with action).
  </action>
  <verify>
    <automated>cd /Users/freptar0/Desktop/Projects/design-guard && npx vitest run packages/cli/tests/unit/advisor.test.ts --reporter=verbose</automated>
  </verify>
  <done>
    All 5 advisor tests pass. getAdvisorReport() suggests /dg-discover when no research exists and no DESIGN.md, suggests /dg-design when research exists but no DESIGN.md, and emits no design/discover blocker when DESIGN.md exists. TypeScript compiles clean.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add discover preamble to dg-design SKILL.md</name>
  <files>.claude/skills/dg-design/SKILL.md</files>
  <action>
    Add a new step 0 at the TOP of the Instructions section in `.claude/skills/dg-design/SKILL.md`, BEFORE the existing step 1. Renumber existing steps 1-7 to 1-7 (they stay the same numbers since the new step is numbered 0).

    Insert this content immediately after `## Instructions` and before the current step 1:

    ```markdown
    0. **Discover check (MUST run before anything else)**:
       - Check if the `.dg-research/` directory exists and contains JSON files.
       - IF `.dg-research/` does NOT exist AND the user has mentioned a specific business name, company, brand, cafe, restaurant, store, or real-world entity:
         - STOP. Tell the user: "I recommend running `/dg-discover` first to research [business name]. This produces a DESIGN.md grounded in real market and competitor data instead of AI defaults. Would you like me to run `/dg-discover` instead?"
         - Only proceed with `/dg-design` if the user explicitly says to skip research.
       - IF `.dg-research/` exists with JSON files: proceed to step 1, using the research data as context for DESIGN.md generation. Read `.dg-research/latest.json` to get the business brief, competitor analysis, and brand colors.
       - IF the user request is generic (no specific business mentioned, e.g., "make a portfolio site" or "create a SaaS dashboard"): proceed directly to step 1. Research is for real businesses, not generic projects.
    ```

    Do NOT modify any other steps. The existing steps 1-7 remain exactly as they are.
  </action>
  <verify>
    <automated>cd /Users/freptar0/Desktop/Projects/design-guard && grep -c "Discover check" .claude/skills/dg-design/SKILL.md && grep -c "dg-research" .claude/skills/dg-design/SKILL.md && grep -c "dg-discover" .claude/skills/dg-design/SKILL.md</automated>
  </verify>
  <done>
    dg-design SKILL.md has a step 0 "Discover check" that: (1) checks for .dg-research/ directory, (2) stops and suggests /dg-discover when user mentions a real business but no research exists, (3) uses existing research when available, (4) skips the check for generic/non-business projects. All original steps 1-7 remain unchanged.
  </done>
</task>

</tasks>

<verification>
1. Advisor tests pass: `npx vitest run packages/cli/tests/unit/advisor.test.ts --reporter=verbose`
2. Full test suite passes: `npm test`
3. TypeScript compiles: `npx tsc --noEmit`
4. dg-design SKILL.md contains "Discover check" as step 0
5. dg-design SKILL.md still contains all 7 original steps (1-7) unchanged
6. advisor.ts contains `researchExists` function checking `.dg-research/` directory
</verification>

<success_criteria>
- advisor.ts differentiates between "no research + no design" (suggest discover) and "has research + no design" (suggest design)
- dg-design SKILL.md has a mandatory step 0 preamble that intercepts business-specific requests and routes to /dg-discover
- 5 new unit tests pass covering both paths and edge cases
- Existing test suite unbroken
</success_criteria>

<output>
After completion, create `.planning/ws4-dogfood-fixes/phase1-01-SUMMARY.md`
</output>
