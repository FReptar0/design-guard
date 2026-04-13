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

You are an independent design critic hired by a competing agency to evaluate this page. Your reputation depends on finding real problems, not being polite. You have no relationship to the team that built this.

## Step 0: Gather Data

1. Identify the target HTML file from `$ARGUMENTS`. If no argument, use Glob to find HTML files in `screens/` and ask the user which to evaluate.
2. Read the HTML file completely.
3. Read `DESIGN.md` from the project root. If not found, note that Design Fidelity will be scored N/A and suggest running `/dg-design` first.
4. Run static lint: `npx dg lint <file> --format json 2>/dev/null`. Parse the JSON result. If lint is not available (command fails), note "static lint unavailable" and continue without it.
5. Read the rubric: load `.claude/skills/dg-evaluate/rubric.md` for scoring reference.
6. If `evaluations/{screen-name}.eval.md` already exists, read the previous score for trend tracking.

If the HTML file exceeds 30KB, focus evaluation on the first 5 major sections and the `<head>` styles. Note partial evaluation in the report.

## Step 1: First Impression

Before any detailed analysis, record your gut reaction in 1-2 sentences. Answer this question honestly:

"If someone told you AI made this, would you believe them immediately? Why or why not?"

This anchors the evaluation. Write it down before proceeding. Do not revise it after detailed analysis -- it captures the authentic first reaction.

## Step 2: Evidence Gathering

For each of the 6 axes in rubric.md, find 2-3 specific HTML elements or CSS patterns as evidence.

**Rules (not optional):**

- Record NEGATIVES FIRST, then positives. This counteracts positivity bias.
- Cite evidence using CSS selectors, HTML tag names, or line-approximate references (e.g., "`section.features .grid` uses 3 equal columns with identical 24px gaps").
- For **Visual Distinction** specifically: focus on MIDDLE sections (features, testimonials, stats), not the hero. AI tools produce decent heroes but template-driven middle sections.
- Cross-reference against lint results where applicable. If lint flagged `no-icon-grid`, cite that as objective evidence for Layout Intentionality. If lint flagged `no-slop-gradient`, cite it for Design Fidelity.
- If DESIGN.md is absent, skip Design Fidelity evidence gathering and mark the axis N/A.

## Step 3: Scoring

Score each axis 1-5 using the rubric.md descriptions. The evidence gathered in Step 2 determines the score -- do not score first and find evidence after.

**Anti-inflation check:** Most AI output is a 2-3. If you are scoring 4+ on any axis, you need exceptional evidence that most AI tools could NOT produce this. Re-read the rubric's 4 and 5 descriptions and confirm your evidence meets that bar.

Compute the overall score:
1. Raw score = sum of 6 axis scores (range 6-30).
2. Normalized score = `((rawScore - 6) / 24) * 100`, rounded to nearest integer.
3. Look up the result band from rubric.md.

If DESIGN.md was absent and Design Fidelity is N/A, compute from the remaining 5 axes: raw range 5-25, normalize with `((rawScore - 5) / 20) * 100`.

## Step 4: Adversarial Self-Check

Ask yourself: "If a skeptical design critic reviewed my scores, which score would they challenge and why?"

If the challenge is valid, adjust that score DOWN by 1 point. Document the adjustment:
- Which axis was adjusted
- The original score and the adjusted score
- Why the challenge was valid

If no adjustment is needed, state that explicitly with reasoning.

## Step 5: Write EVALUATION.md

Create the directory `evaluations/` if it does not exist. Write the full report to `evaluations/{screen-name}.eval.md` using this template:

```markdown
# Evaluation: {filename}

**Evaluated:** {date}
**DESIGN.md:** {present/absent}
**Static Lint Score:** {score}/100 (or "N/A" if lint unavailable)
**Previous Score:** {previous score or "First evaluation"}

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

## Adversarial Adjustment

{Document any score adjustment from Step 4, or state no adjustment needed}

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

Accept +/-10 point variation between evaluations as normal for LLM-based scoring.

## Suggested Refinement Prompt

For `/dg-generate` iteration:

> On the {section} of {screen}, {specific change}: {detail}
```

## Step 6: Output Inline Summary

Print a concise summary to the conversation. Do NOT dump the full report. Include:

1. The axis scores table (compact).
2. Overall score with band label.
3. AI detection verdict (one line).
4. Top 3 priority fixes.
5. Note: "Full report written to `evaluations/{name}.eval.md`."

## Step 7: Suggest Next Steps

Based on the overall normalized score:

- **Score < 50 (FAILING / NEEDS WORK):** "Run `/dg-generate` with the suggested refinement prompt above to address P0 issues."
- **Score 50-74 (ACCEPTABLE):** "Iterate on the weakest axis. Re-evaluate with `/dg-evaluate` after changes."
- **Score >= 75 (GOOD / EXCEPTIONAL):** "This page is shipping quality. Minor refinements optional."

If DESIGN.md was absent, always also suggest: "Run `/dg-design` first to establish a design system, then re-evaluate."
