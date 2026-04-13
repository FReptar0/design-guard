# Plan: /dg-evaluate Skill (Tier 3 Deep Evaluation)

## Objective

Create the `/dg-evaluate` Claude Code skill that performs deep design quality evaluation of AI-generated HTML against DESIGN.md. The skill uses a 6-axis evidence-anchored rubric with bias mitigation, produces dual output (inline summary table + EVALUATION.md file), and integrates with the existing `dg lint` static analysis as objective ground truth.

Purpose: Static lint (Tier 2) catches syntactic patterns like wrong fonts or slop gradients. This skill (Tier 3) catches systemic patterns -- "this looks like every other AI landing page" -- that no rule-based system can detect. Together they form a complete quality gate.

Output: Two files in `.claude/skills/dg-evaluate/` (SKILL.md and rubric.md), ready for immediate use.

## Context

```
@DESIGN.md                                          — Project design spec (evaluation target)
@.claude/skills/dg-design/SKILL.md                  — Existing skill pattern (frontmatter, structure)
@.claude/skills/dg-generate/SKILL.md                — Existing skill pattern (guardrails, flow)
@packages/core/src/validation/output-validator.ts    — Static lint engine (types, scoring)
@packages/core/src/validation/rules/types.ts         — LintRule/LintContext interfaces
@packages/cli/src/commands/lint.ts                   — CLI lint command (flags, output formats)
@.planning/ws2-evaluate-skill/RESEARCH.md            — Full research on rubric, bias, output strategy
```

### Key interfaces from existing code

From `output-validator.ts`:
```typescript
export interface OutputValidationResult {
  score: number;           // 0-100
  issues: ValidationIssue[];
  passed: boolean;         // score >= 70
  confidence: number;      // 0-100
  breakdown: ScoringBreakdown;
}
```

CLI lint invocation: `npx dg lint <file> --format json` returns JSON with `designSystem`, `files[]`, `summary`.

### Existing skill conventions
- Frontmatter: `name`, `description`, optional `allowed-tools`, `context`, `disable-model-invocation`, `effort`
- Body: Markdown instructions with numbered steps
- All skills prefixed `dg-`
- Tools used: MCP tools, Read, Write, Bash
- Next step suggestion at the end

## Tasks

---

### Task 1: Create the rubric reference file

**Files:** `.claude/skills/dg-evaluate/rubric.md`

**Action:**

Create the locked rubric definition file that SKILL.md references. This file contains ALL scoring detail so that SKILL.md stays under the 5,000-token compaction-safe limit. The rubric must include:

1. **Anti-inflation anchoring preamble** -- "Most AI output genuinely scores 2-3. A 4 means a designer would need to look twice. A 5 means indistinguishable from human work. If you are giving 4s frequently, you are grade-inflating."

2. **Six axes with explicit 1-5 descriptions per axis:**
   - **Design Fidelity (20%)** -- Does output match DESIGN.md specs?
     - 1: Ignores DESIGN.md entirely (wrong fonts, wrong colors, wrong spacing)
     - 2: Uses some DESIGN.md values but mixes in AI defaults (Inter appears, purple-blue gradients sneak in)
     - 3: Colors and fonts match DESIGN.md but spacing/layout feel mechanical
     - 4: All DESIGN.md values applied correctly with intentional variation
     - 5: DESIGN.md brought to life -- the spec feels like it was written AFTER seeing this page
   - **Visual Distinction (20%)** -- Would someone immediately know AI made this?
     - 1: Carbon copy of every AI landing page (hero + 3-col icons + testimonials + CTA)
     - 2: Recognizable AI template with minor customization (colors changed, copy swapped)
     - 3: Some original layout choices but still has 2+ AI tells (uniform spacing, symmetric grids)
     - 4: Would require inspection to suspect AI; layout has genuine surprises
     - 5: Could appear in a designer's portfolio; no AI tells visible
   - **Content Authenticity (15%)** -- Is copy real, specific, non-generic?
     - 1: Lorem ipsum or "Transform your X with our Y" throughout
     - 2: Mostly generic SaaS copy with a few product-specific terms inserted
     - 3: Product-specific copy but relies on buzzwords ("seamless", "revolutionary")
     - 4: Reads like a human copywriter wrote it; specific claims and real details
     - 5: Distinctive voice that matches brand personality; memorable phrasing
   - **Layout Intentionality (15%)** -- Does layout serve content, or is it a template?
     - 1: Pure template: hero > 3-col features > testimonials > CTA, no thought to content needs
     - 2: Template with one non-standard section (but the rest follows the formula)
     - 3: Layout mostly serves content but has mechanical regularity (all sections same height/structure)
     - 4: Layout adapts to content -- dense info gets more space, CTAs breathe, sections flow naturally
     - 5: Layout DRIVES the narrative; you could not rearrange sections without losing impact
   - **Component Craft (15%)** -- Are components designed or default?
     - 1: Browser defaults or minimal styling; components feel like a prototype
     - 2: Styled but uniform -- every button, card, and input looks the same (same radius, same shadow, same spacing)
     - 3: Components have distinct styles but lack polish (hover states present but generic)
     - 4: Refined interaction states, intentional variation between component types
     - 5: Components have personality; micro-interactions, thoughtful transitions, purposeful asymmetry
   - **Coherence (15%)** -- Does the page work as a unified whole?
     - 1: Sections feel copy-pasted from different sites; no visual thread
     - 2: Color palette is consistent but rhythm, density, and tone shift randomly
     - 3: Visually consistent but metronomic (same padding, same structure, same rhythm throughout)
     - 4: Consistent with intentional variation; the page breathes and flows
     - 5: Every element supports every other; removing one section would leave a visible gap

3. **Evidence format requirements:**
   ```
   ### [Axis Name]: [Score]/5

   **Evidence (negative):**
   - `<selector or line ref>`: [specific observation]

   **Evidence (positive):**
   - `<selector or line ref>`: [specific observation]

   **Reasoning:** [1-2 sentences explaining score]
   **Fix suggestion:** [1 actionable improvement, tagged P0-P3]
   ```

4. **Score normalization formula:**
   `NormalizedScore = ((rawScore - 6) / 24) * 100` where rawScore is sum of six axis scores (range 6-30).

5. **Result bands:**
   | Range | Label | Meaning |
   |-------|-------|---------|
   | 0-24  | FAILING | Obvious AI output, start over |
   | 25-49 | NEEDS WORK | Has potential but AI tells dominate |
   | 50-74 | ACCEPTABLE | Passes basic quality bar, iterate on weak axes |
   | 75-89 | GOOD | Genuine design quality, minor refinements only |
   | 90-100 | EXCEPTIONAL | Portfolio-grade, ship it |

**Verify:** File exists at `.claude/skills/dg-evaluate/rubric.md`. Contains all 6 axes with 5 score levels each (30 score-level descriptions total). Contains the normalization formula and result bands. File is under 4,000 tokens (check with `wc -w` -- roughly 3,000 words max).

```bash
test -f .claude/skills/dg-evaluate/rubric.md && echo "EXISTS" || echo "MISSING"
grep -c "^   - [1-5]:" .claude/skills/dg-evaluate/rubric.md  # Should be ~30
wc -w .claude/skills/dg-evaluate/rubric.md  # Should be under 3000
```

**Done:** rubric.md contains all 6 axes with explicit 1-5 descriptions, evidence format requirements, normalization formula, and result bands. Under 3,000 words.

---

### Task 2: Create the main evaluation skill

**Files:** `.claude/skills/dg-evaluate/SKILL.md`

**Action:**

Create the main skill file. This is the prompt Claude receives when `/dg-evaluate` is invoked. It must stay under 5,000 tokens (compaction-safe limit from research). Heavy scoring detail lives in `rubric.md` which the skill loads on demand.

**Frontmatter:**
```yaml
---
name: dg-evaluate
description: >
  Deep design quality evaluation of AI-generated HTML against DESIGN.md.
  Use when the user wants to check if a generated screen looks like
  obvious AI output, assess design fidelity, or get actionable
  improvement suggestions. Produces a scored evaluation report with
  evidence-backed findings.
argument-hint: "[screens/file.html or path/to/file.html]"
disable-model-invocation: true
context: fork
effort: high
allowed-tools: Read Bash(npx dg lint *) Glob Grep Write
---
```

**Skill body -- implement these steps exactly:**

**Role preamble (FIRST LINE of body, before anything else):**
"You are an independent design critic hired by a competing agency to evaluate this page. Your reputation depends on finding real problems, not being polite. You have no relationship to the team that built this."

**Step 0: Gather Data**
1. Identify the target HTML file from `$ARGUMENTS`. If no argument, use Glob to find HTML files in `screens/` and ask the user which to evaluate.
2. Read the HTML file.
3. Read `DESIGN.md` from the project root. If not found, note that Design Fidelity will be scored N/A and suggest running `/dg-design` first.
4. Run static lint: `npx dg lint <file> --format json 2>/dev/null`. Parse the JSON result. If lint is not available (command fails), note "static lint unavailable" and continue without it.
5. Read the rubric: load `.claude/skills/dg-evaluate/rubric.md` for scoring reference.

**Step 1: First Impression (BEFORE detailed analysis)**
Record gut reaction in 1-2 sentences. Answer: "If someone told you AI made this, would you believe them immediately? Why or why not?" This anchors the evaluation and prevents score drift during detailed analysis.

**Step 2: Evidence Gathering (Per Axis)**
For each of the 6 axes in rubric.md:
- Find 2-3 specific HTML elements or CSS patterns as evidence.
- Cite evidence using CSS selectors, HTML tag names, or line-approximate references (e.g., "`section.features .grid` uses 3 equal columns with identical 24px gaps").
- Record NEGATIVES FIRST, then positives. This is a bias mitigation technique -- it is not optional.
- For Visual Distinction specifically: focus on MIDDLE sections (features, testimonials, stats), not the hero. AI tools produce decent heroes but template-driven middle sections.
- Cross-reference against lint results where applicable (e.g., if lint flagged `no-icon-grid`, cite that as objective evidence for Layout Intentionality).

**Step 3: Scoring (Evidence-Anchored)**
- Score each axis 1-5 using the rubric.md descriptions. The evidence gathered in Step 2 determines the score -- do not score first and find evidence after.
- Apply the anti-inflation anchor: "Most AI output is a 2-3. If you are scoring 4+, you need exceptional evidence that most AI tools could NOT produce this."
- Compute raw score (sum of 6 axes), then normalize: `NormalizedScore = ((rawScore - 6) / 24) * 100`.
- Determine result band from rubric.md.

**Step 4: Adversarial Self-Check**
Ask yourself: "If a skeptical design critic reviewed my scores, which score would they challenge and why?" If the challenge is valid, adjust that score down by 1 point. Document the adjustment.

**Step 5: Write EVALUATION.md**
Write the full report to `evaluations/{screen-name}.eval.md` (create the `evaluations/` directory if it does not exist). Use this template:

```markdown
# Evaluation: {filename}

**Evaluated:** {date}
**DESIGN.md:** {present/absent}
**Static Lint Score:** {score}/100 (or "N/A" if lint unavailable)

## First Impression

{gut reaction from Step 1}

## Axis Scores

| Axis | Score | Key Finding |
|------|-------|-------------|
| Design Fidelity | {n}/5 | {one-liner} |
| Visual Distinction | {n}/5 | {one-liner} |
| Content Authenticity | {n}/5 | {one-liner} |
| Layout Intentionality | {n}/5 | {one-liner} |
| Component Craft | {n}/5 | {one-liner} |
| Coherence | {n}/5 | {one-liner} |

**Overall: {normalized}/100 ({BAND})**

## Detailed Findings

{Per-axis evidence blocks using the format from rubric.md}

## AI Detection Verdict

**Would you immediately know AI made this?** {Yes/No/Maybe}
**Why:** {specific tells or lack thereof}
**First impression vs. detailed analysis:** {Did your answer change? If so, why?}

## Priority Fixes

| Priority | Fix | Section | Expected Impact |
|----------|-----|---------|----------------|
| P0 | {critical fix} | {section} | {what it improves} |
| P1 | {important fix} | {section} | {what it improves} |
| P2 | {nice-to-have fix} | {section} | {what it improves} |

## What Works Well

- {positive finding}
- {positive finding}

## Score Context

Static Lint Score: {lint_score}/100 -- measures technical compliance (fonts, colors, patterns).
Deep Evaluation Score: {eval_score}/100 -- measures design quality (distinction, craft, coherence).
A page can pass lint and still look like obvious AI output.

## Suggested Refinement Prompt

For `/dg-generate` iteration:

> On the {section} of {screen}, {specific change}: {detail}
```

**Step 6: Output Inline Summary**
Print a concise summary table to the conversation (NOT the full report). Include: axis scores table, overall score with band, AI detection verdict, top 3 priority fixes, and a note that the full report is at `evaluations/{name}.eval.md`.

**Step 7: Suggest Next Steps**
- If score < 50: "Run `/dg-generate` with the suggested refinement prompt above to address P0 issues."
- If score 50-74: "Iterate on the weakest axis. Re-evaluate with `/dg-evaluate` after changes."
- If score >= 75: "This page is shipping quality. Minor refinements optional."

**Additional instructions to include:**
- If the HTML file exceeds 30KB, focus evaluation on the first 5 major sections and the `<head>` styles. Note partial evaluation in the report.
- If evaluating the same file again (evaluations/{name}.eval.md already exists), note the previous score in the report header for trend tracking.
- Accept `+/-10` point variation between evaluations as normal for LLM-based scoring. Communicate this if the user re-evaluates.

**Verify:** File exists at `.claude/skills/dg-evaluate/SKILL.md`. Contains the required frontmatter fields (`context: fork`, `disable-model-invocation: true`, `effort: high`, `allowed-tools`). Body contains all 7 steps. File is under 5,000 tokens (check with `wc -w` -- roughly 3,500 words max).

```bash
test -f .claude/skills/dg-evaluate/SKILL.md && echo "EXISTS" || echo "MISSING"
grep -c "^## Step\|^**Step" .claude/skills/dg-evaluate/SKILL.md  # Should be 7-8
grep "context: fork" .claude/skills/dg-evaluate/SKILL.md && echo "FORK OK"
grep "disable-model-invocation: true" .claude/skills/dg-evaluate/SKILL.md && echo "DMI OK"
wc -w .claude/skills/dg-evaluate/SKILL.md  # Should be under 3500
```

**Done:** SKILL.md contains complete evaluation flow with persona shift as first line of body, all 7 steps, bias mitigations (negative-first, evidence-before-score, adversarial self-check, anti-inflation anchoring), dual output (inline + EVALUATION.md), lint integration, and next-step suggestions. Under 3,500 words.

---

### Task 3: Verify against dogfood demos

**Files:** No new files created. Verification only.

**Action:**

Run `/dg-evaluate` against two contrasting pages to validate that the rubric discriminates effectively:

1. **Low-quality test** -- Run against a dogfood demo page:
   ```bash
   # First run static lint to confirm it works
   npx dg lint public/demos/dogfood-v3/index.html --format json
   ```
   Then invoke the skill (simulated by reading the SKILL.md and following its steps manually against the HTML).

   Expected: Score should be in the 25-50 range (NEEDS WORK). The dogfood pages are AI-generated with known slop patterns (uniform spacing, template layouts, generic copy). If the score exceeds 50, the rubric has inflation issues.

2. **Comparative check** -- Read through the DESIGN.md and check that the rubric axes map cleanly to verifiable HTML attributes:
   - Design Fidelity: Can we check DESIGN.md colors/fonts against the HTML? (Yes -- lint already does this, and the skill cross-references)
   - Visual Distinction: Can we identify AI layout patterns in the HTML structure? (Yes -- section ordering, grid symmetry)
   - Content Authenticity: Can we find generic copy in the text nodes? (Yes -- SaaS-speak patterns)
   - Layout Intentionality: Can we assess section diversity from DOM structure? (Yes -- repeated patterns)
   - Component Craft: Can we check for uniform styling patterns? (Yes -- border-radius, shadows)
   - Coherence: Can we assess visual rhythm from spacing/structure? (Yes -- padding patterns)

3. **Skill structure validation:**
   ```bash
   # Verify skill is discoverable by Claude Code
   ls .claude/skills/dg-evaluate/SKILL.md
   ls .claude/skills/dg-evaluate/rubric.md

   # Verify frontmatter is valid YAML
   head -20 .claude/skills/dg-evaluate/SKILL.md

   # Verify rubric is loadable (not too large)
   wc -c .claude/skills/dg-evaluate/rubric.md  # Should be under 15KB
   ```

**Verify:**

```bash
# All files exist
test -f .claude/skills/dg-evaluate/SKILL.md && test -f .claude/skills/dg-evaluate/rubric.md && echo "ALL FILES PRESENT"

# Lint runs against dogfood page (proves lint integration path works)
npx dg lint public/demos/dogfood-v3/index.html --format json 2>/dev/null | head -5

# Skill frontmatter is parseable (first line after --- is a key: value)
head -12 .claude/skills/dg-evaluate/SKILL.md | grep "name: dg-evaluate"

# Rubric has all 6 axes
grep -c "^### " .claude/skills/dg-evaluate/rubric.md  # Should be >= 6
```

**Done:** Both skill files exist and are structurally valid. Lint integration path confirmed (dg lint runs against dogfood HTML and returns JSON). Rubric contains all 6 axes. Skill frontmatter is parseable with required fields. Dogfood page lint score provides a baseline for evaluation comparison.

---

## Dependency Graph

```
Task 1 (rubric.md)  ──> Task 2 (SKILL.md)  ──> Task 3 (verification)
   [no deps]              [needs rubric]          [needs both files]
```

Wave 1: Task 1 (rubric.md -- standalone, no dependencies)
Wave 2: Task 2 (SKILL.md -- references rubric.md, needs it to exist for file path accuracy)
Wave 3: Task 3 (verification -- needs both files written)

All three tasks are sequential. No parallelism possible since each depends on the prior.

## Verification Criteria

1. **Rubric discrimination**: The rubric must produce meaningfully different scores for AI-generated pages (expected 25-50) vs. well-designed pages (expected 70+). If dogfood demos score above 50, the anti-inflation anchoring needs tightening.

2. **Evidence specificity**: Every axis score in a sample evaluation must cite at least one specific CSS selector, HTML element, or content excerpt. No vague claims like "the layout feels template-like" without pointing to the specific `section > .grid-cols-3` that proves it.

3. **Lint integration**: The skill must successfully run `npx dg lint <file> --format json` and incorporate the result. If lint returns errors/warnings, those must appear as objective evidence in the relevant axis evaluation.

4. **Bias mitigation stack active**: The skill must include all 7 mitigations from research:
   - Subagent isolation (`context: fork` in frontmatter)
   - Persona shift (first line of body)
   - Devil's advocate framing ("find every flaw")
   - Negative-first evidence ordering
   - Evidence-before-score discipline
   - Anti-inflation anchoring ("most AI output is 2-3")
   - Adversarial self-check (Step 4)

5. **Dual output**: Produces both an inline summary table AND writes `evaluations/{name}.eval.md`.

6. **Token budget**: SKILL.md under 3,500 words. rubric.md under 3,000 words. Combined under 6,500 words (well within the compaction-safe zone).

## Success Criteria

- `.claude/skills/dg-evaluate/SKILL.md` exists with valid frontmatter and 7-step evaluation flow
- `.claude/skills/dg-evaluate/rubric.md` exists with 6 axes, 30 score-level descriptions, normalization formula
- `npx dg lint public/demos/dogfood-v3/index.html --format json` returns valid JSON (lint integration path works)
- Skill is invocable as `/dg-evaluate` in Claude Code (file in correct directory with correct frontmatter)
- Combined word count of both files is under 6,500 words
