# Stitch Forge: System Viability Analysis

> Generated 2026-04-11 — Honest assessment of whether this tool solves a real problem or is hype.

## Executive Summary

**The core ideas are real and valuable. The packaging and vehicle (Google Stitch wrapper) are the problem.** Stitch Forge is a sophisticated research prototype with genuine insights about AI design quality, but it hasn't found its market. The business intelligence layer, anti-slop validation, and DESIGN.md protocol are legitimate engineering — they just need a different vehicle.

## System State Audit

| Metric | Value |
|--------|-------|
| Lines of TypeScript | 6,048 |
| Test files | 12 (121 tests, all pass) |
| TypeScript strict mode | Compiles clean, zero errors |
| Total commits | 45 |
| Development time span | ~1.5 days (Apr 10-11, 2026) |
| Contributors | 1 |
| GitHub Issues | 0 |
| External PRs | 0 |
| Releases | 3 (v0.1.0 → v0.3.1) |
| Community adoption signals | None detected |

## What Works (Real Pain Points Solved)

### 1. Business Model Intelligence

The core discovery is genuine: AI design tools default to e-commerce patterns for all businesses, even physical-only retailers. The `business-researcher.ts` module (997 lines) analyzes website navigation, CTAs, and content to infer business type before generating, preventing fundamental misalignment like adding shopping carts to store-locator sites.

### 2. Anti-Slop Validation

The `output-validator.ts` catches endemic AI design patterns: Inter/Poppins font defaults, purple-to-blue gradients, three-column icon grids, heading hierarchy violations, and business-model misaligned elements. This addresses a verified, widespread problem.

### 3. DESIGN.md Protocol

A structured 14-industry × 6-aesthetic design system with concrete hex values, font weights, spacing scales, and industry-specific Do's/Don'ts. Actionable constraints, not vague adjectives.

## Fundamental Gaps

### 1. The User Paradox
The tool targets Claude Code users via slash commands — but Claude Code already generates interactive, full-stack websites superior to Stitch's static HTML/CSS output.

### 2. Platform Dependency Risk
100% of value depends on Google Stitch continuing to exist, maintaining API stability, and not absorbing these features natively.

### 3. Quota Ceiling
350 Flash + 200 Pro generations/month limits practical use to 4-14 projects monthly.

### 4. Static Output in a Dynamic World
Stitch produces HTML/CSS mockups, not functional websites. Buttons don't work. Forms don't submit. Store locators don't locate.

### 5. CLI Friction vs. Web Competition
7 steps before seeing a page, vs. competitors (v0, bolt.new, lovable) that are browser-based with one-click deploy.

### 6. Zero Market Validation
No external usage signals: 0 issues, 0 community PRs, 0 discussions.

## Viability Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Real problem | 7/10 | AI design quality is a genuine pain |
| Product-market fit | 2/10 | Wrong target, wrong channel, wrong vehicle |
| Technical execution | 6/10 | Real code, tests, types — but zero battle-testing |
| Defensibility | 1/10 | Google can absorb all value overnight |
| Community traction | 0/10 | No external adoption signals |
| Timing | 4/10 | Stitch is new, but web-first competitors already won UX |

## Recommendation

The valuable pieces should become **generator-agnostic middleware**:

1. **Business Intelligence Layer** — A preprocessor any AI tool (Claude, v0, Stitch, GPT) can consume before generating
2. **Anti-Slop Validator** — A post-generation linter for HTML/CSS from any source
3. **DESIGN.md Protocol** — An open standard any AI design tool can read

Instead of a Stitch wrapper, this should be a **quality layer** between users and any AI generator.

**Verdict: Valuable research prototype with real insights. Not a viable product in current form. The ideas deserve to live — in a different vehicle.**
