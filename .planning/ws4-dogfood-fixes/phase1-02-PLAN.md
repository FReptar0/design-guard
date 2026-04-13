---
phase: phase1-skill-flow-fixes
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/skills/dg-generate/SKILL.md
autonomous: true
requirements: [SF-02, SF-03]

must_haves:
  truths:
    - "dg-generate presents generator choice (Stitch vs Claude Code) when .guardrc.json has no generator field"
    - "dg-generate uses configured generator without asking when .guardrc.json has generator field set"
    - "dg-generate saves the user's generator choice to .guardrc.json for future use"
    - "When Stitch times out, dg-generate tells the user and suggests /dg-sync before any fallback"
    - "dg-generate never silently switches from Stitch to Claude Code generation"
    - "Only after /dg-sync confirms no server-side screen does dg-generate offer Claude Code fallback"
  artifacts:
    - path: ".claude/skills/dg-generate/SKILL.md"
      provides: "Generator selection + timeout recovery instructions"
      contains: "Generator selection"
    - path: ".claude/skills/dg-generate/SKILL.md"
      provides: "Timeout recovery section"
      contains: "Timeout Recovery"
  key_links:
    - from: ".claude/skills/dg-generate/SKILL.md"
      to: ".guardrc.json"
      via: "generator field read/write"
      pattern: "guardrc.*generator"
    - from: ".claude/skills/dg-generate/SKILL.md"
      to: ".claude/skills/dg-sync/SKILL.md"
      via: "timeout recovery suggests /dg-sync"
      pattern: "dg-sync"
---

<objective>
Add generator selection and timeout recovery to the dg-generate skill so that:
(1) users choose between Stitch and Claude Code before generation, with the choice
persisted to config, and (2) Stitch timeouts trigger a transparent recovery flow
(suggest sync, then ask user) instead of silent Claude Code fallback.

Purpose: The dogfood session revealed two P0 issues -- the user was never asked which
generator to use (Stitch was assumed), and when Stitch timed out 5 times, Claude silently
generated 3 pages locally without asking. Both break user trust and transparency.

Output: Updated dg-generate SKILL.md with generator selection step and timeout recovery
section. No TypeScript code changes needed -- these are skill instruction changes.
</objective>

<execution_context>
@/Users/freptar0/.claude/get-shit-done/workflows/execute-plan.md
@/Users/freptar0/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ws4-dogfood-fixes/ROADMAP.md
@.planning/ws4-dogfood-fixes/phase1-RESEARCH.md
@.claude/skills/dg-generate/SKILL.md
@.claude/skills/dg-sync/SKILL.md
@packages/cli/src/utils/config.ts
@packages/cli/src/generators/index.ts

<interfaces>
<!-- Key types and contracts the executor needs. -->

From packages/cli/src/utils/config.ts:
```typescript
export type GeneratorType = 'stitch' | 'claude';

export interface StitchConfig {
  generator?: GeneratorType;
  // ... other fields
}

export function getConfig(): StitchConfig;
export function updateConfig(updates: Partial<StitchConfig>): StitchConfig;
```

From packages/cli/src/generators/index.ts:
```typescript
export function getGenerator(name: string): DesignGenerator;
export function listGenerators(): string[];  // Returns ['stitch', 'claude']
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add generator selection step to dg-generate SKILL.md</name>
  <files>.claude/skills/dg-generate/SKILL.md</files>
  <action>
    Modify `.claude/skills/dg-generate/SKILL.md` to add a generator selection step BEFORE the existing instructions, and add a timeout recovery section AFTER the existing instructions.

    **Change 1: Add step 0 "Generator selection" at the top of Instructions.**

    Insert immediately after `## Instructions` and before the current step 1 ("Read DESIGN.md"):

    ```markdown
    0. **Generator selection (MUST run before generating)**:
       - Read `.guardrc.json` and check the `generator` field.
       - **IF `generator` is already set** (value is `"stitch"` or `"claude"`):
         - Use it. Tell the user: "Using **[Stitch MCP / Claude Code]** as your configured generator."
         - Do NOT ask again.
       - **IF `generator` is NOT set** (field missing or `.guardrc.json` does not exist):
         - Present the options to the user:

           "Which generator would you like to use for this project?

           1. **Claude Code** (recommended) -- Generates HTML locally. Anti-slop rules from `.claude/rules/` are enforced during generation. Best for design-system compliance.
           2. **Google Stitch** -- Generates via Stitch MCP. More creative/varied layouts, but anti-slop rules do NOT apply during generation (the critic catches issues after).

           Which do you prefer? (Default: Claude Code)"

         - If the user picks Claude Code (or does not express a preference): set `generator` to `"claude"`.
         - If the user picks Stitch: set `generator` to `"stitch"`.
         - Save the choice to `.guardrc.json` by updating the `generator` field (create file with defaults if it does not exist).
         - Tell the user: "Saved generator preference to .guardrc.json. You can change it anytime by editing the file or telling me to switch."
    ```

    **Change 2: Modify step 4 to branch on generator choice.**

    The current step 4 says "Generate the screen by calling mcp__stitch__generate_screen_from_text". Replace it with:

    ```markdown
    4. **Generate the screen**:
       - **IF generator is `stitch`**: Call `mcp__stitch__generate_screen_from_text` with the prompt. Include the Stitch project ID from `.guardrc.json`.
       - **IF generator is `claude`**: Generate a complete, single-file HTML page directly. Follow these constraints:
         - Apply ALL rules from `.claude/rules/anti-slop-design.md`
         - Apply ALL rules from `.claude/rules/design-system-adherence.md`
         - Apply ALL rules from `.claude/rules/content-authenticity.md`
         - Follow DESIGN.md for all color, typography, spacing, and component decisions
         - Use the zoom-out-zoom-in prompt structure from step 3 as the page specification
         - Output a complete HTML file with embedded CSS (no external dependencies except Google Fonts)
         - Run the self-check from `.claude/rules/post-generation-evaluation.md` before presenting
    ```

    **Change 3: Add Timeout Recovery section at the end of the file.**

    After the existing step 12 (next step guidance) and before the "Reference:" line, add:

    ```markdown
    ## Error Handling

    ### Stitch Timeout Recovery

    IF a Stitch MCP call (`mcp__stitch__generate_screen_from_text`) times out, hangs, or returns an error:

    1. **Do NOT silently switch to Claude Code generation.** The user chose Stitch and must be informed.
    2. Tell the user exactly what happened: "Stitch MCP timed out while generating [screen name]. The screen may have been created server-side even though the response didn't come back."
    3. **Suggest sync first**: "I recommend running `/dg-sync` to check if the screen was completed on Stitch's end. Want me to do that?"
    4. IF the user agrees to sync:
       - Run `/dg-sync` (call `mcp__stitch__list_screens` to check for the screen).
       - IF the screen is found server-side: download it, save to `screens/`, and tell the user: "Found the screen on Stitch! Downloaded to screens/[name].html."  Done -- do NOT generate again.
       - IF the screen is NOT found: tell the user: "Stitch did not complete this screen."
    5. **Only then offer fallback**: "Would you like me to generate this screen locally with Claude Code instead? (Anti-slop rules will be enforced.)"
    6. Generate locally with Claude Code ONLY if the user explicitly agrees.
    7. **NEVER**:
       - Retry the Stitch call (the timeout suggests a server-side issue)
       - Send parallel requests to Stitch
       - Generate locally without asking
       - Pretend the timeout didn't happen

    ### Claude Code Generation Errors

    IF generating locally with Claude Code and the output is incomplete or malformed:
    1. Tell the user what went wrong.
    2. Offer to retry generation.
    3. Do NOT switch to Stitch as a fallback.
    ```

    **Change 4: Update the skill description in frontmatter.**

    Update the `description` field in the YAML frontmatter to reflect that dg-generate now supports both generators. Change:
    ```
    Generate a screen in Google Stitch from a text description.
    ```
    To:
    ```
    Generate a screen using Google Stitch or Claude Code from a text description.
    ```

    Also update the one-liner below the frontmatter from:
    ```
    Generate a screen in Google Stitch from a description.
    ```
    To:
    ```
    Generate a screen from a description using the configured generator (Stitch or Claude Code).
    ```
  </action>
  <verify>
    <automated>cd /Users/freptar0/Desktop/Projects/design-guard && grep -c "Generator selection" .claude/skills/dg-generate/SKILL.md && grep -c "Timeout Recovery" .claude/skills/dg-generate/SKILL.md && grep -c "dg-sync" .claude/skills/dg-generate/SKILL.md && grep -c "Do NOT silently" .claude/skills/dg-generate/SKILL.md && grep -c "guardrc" .claude/skills/dg-generate/SKILL.md</automated>
  </verify>
  <done>
    dg-generate SKILL.md has: (1) a step 0 "Generator selection" that reads .guardrc.json, presents options on first use, saves choice, and respects existing config; (2) a branching step 4 with separate instructions for Stitch vs Claude Code generation; (3) a "Stitch Timeout Recovery" section that suggests /dg-sync first and asks the user before any fallback; (4) updated frontmatter reflecting both generators. All original guardrails and steps remain intact. The NEVER list explicitly bans silent fallback, parallel requests, and retry.
  </done>
</task>

</tasks>

<verification>
1. dg-generate SKILL.md contains "Generator selection" step 0 with .guardrc.json check
2. dg-generate SKILL.md step 4 branches on generator choice (stitch vs claude)
3. dg-generate SKILL.md contains "Stitch Timeout Recovery" section with /dg-sync suggestion
4. dg-generate SKILL.md contains "Do NOT silently switch" instruction
5. dg-generate SKILL.md contains NEVER list (no retry, no parallel, no silent fallback)
6. Frontmatter description mentions both generators
7. All original guardrails (steps 1-3, 5-12) remain intact
8. Full test suite passes: `npm test`
</verification>

<success_criteria>
- dg-generate skill presents generator choice on first use and respects saved config thereafter
- dg-generate skill has explicit Claude Code generation instructions with anti-slop rule enforcement
- Stitch timeout triggers a visible, user-controlled recovery flow (sync first, then ask)
- Silent fallback is explicitly banned with NEVER instructions
- No changes to TypeScript code (this is purely a skill instruction update)
</success_criteria>

<output>
After completion, create `.planning/ws4-dogfood-fixes/phase1-02-SUMMARY.md`
</output>
