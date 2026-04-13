---
phase: ws1-rules
plan: "01"
subsystem: rules
tags: [anti-slop, rules, design-system, content-quality, post-generation]
dependency-graph:
  requires: []
  provides: [anti-slop-design-rules, design-system-adherence-rules, content-authenticity-rules, post-generation-evaluation-rules]
  affects: [dg-generate, dg-design, output-validator]
tech-stack:
  added: []
  patterns: [BAN-PATTERN-WHY-INSTEAD, checklist-based-self-evaluation, section-based-protocol]
key-files:
  created:
    - .claude/rules/anti-slop-design.md
    - .claude/rules/design-system-adherence.md
    - .claude/rules/content-authenticity.md
    - .claude/rules/post-generation-evaluation.md
  modified: []
decisions:
  - No paths: frontmatter on any rule file so all load at session start
  - BAN/PATTERN/WHY/INSTEAD format for actionable anti-slop rules
  - Checklist format for post-generation evaluation (not BAN format)
  - Section-based protocol for design system adherence (not BAN format)
metrics:
  duration: 4m 1s
  completed: 2026-04-13T04:57:40Z
  tasks: 3
  files-created: 4
  files-modified: 0
---

# Phase ws1-rules Plan 01: Anti-Slop Rules Summary

20 BAN rules across 4 session-loaded rule files preventing AI design slop at generation time, covering visual patterns, DESIGN.md enforcement, content authenticity, and post-generation self-evaluation.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create anti-slop-design.md and design-system-adherence.md | 9376322 | .claude/rules/anti-slop-design.md, .claude/rules/design-system-adherence.md |
| 2 | Create content-authenticity.md and post-generation-evaluation.md | c9ee7b2 | .claude/rules/content-authenticity.md, .claude/rules/post-generation-evaluation.md |
| 3 | Validate rule files and verify non-duplication | (validation only) | All 4 rule files verified |

## What Was Built

### anti-slop-design.md (96 lines, 15 BAN rules)
- Typography (4): Icon-Tile-Above-Heading, Single Font, Flat Type Hierarchy, All-Caps Body Text
- Color (4): Gradient Text on Headings, Dark-Glow Box Shadows, Pure Black Backgrounds, Opacity-as-Palette
- Layout (3): Metronomic Section Spacing, Nested Cards, Three Identical Cards in a Row
- Components (4): Side-Tab Accent Borders, Uniform Glassmorphism, Every Button Is Primary, Border Accent on Rounded Elements

### design-system-adherence.md (74 lines, 6 sections)
- BEFORE GENERATING: Read DESIGN.md, extract tokens, load Section 8 as hard constraints
- COLOR COMPLIANCE: Hex values from palette only, no named CSS colors
- TYPOGRAPHY COMPLIANCE: Exact font families/sizes/weights from DESIGN.md
- SPACING COMPLIANCE: Base unit and scale from Section 4
- COMPONENT COMPLIANCE: Button, card, code block, icon, imagery styles from Sections 5-7
- VERIFICATION AFTER GENERATING: 6-point checklist against DESIGN.md sections

### content-authenticity.md (63 lines, 5 BAN rules)
- Hallucinated Features and Commands
- Invented Statistics and Social Proof
- Generic Product Copy
- Uniform CTA Language
- Filler Sections with No Real Content

### post-generation-evaluation.md (90 lines, 5 tests)
- The AI-Tell Test (8 checklist items)
- The DESIGN.md Compliance Test (5 checklist items)
- The Content Truth Test (5 checklist items)
- The Specificity Test (3 checklist items)
- The Variation Test (4 checklist items)

## Gap Coverage Mapping

All 15 gap patterns from RESEARCH.md Section 3 are addressed:

| Gap Pattern | Rule File | Rule Name |
|-------------|-----------|-----------|
| Side-tab accent borders | anti-slop-design.md | BAN: Side-Tab Accent Borders |
| Icon-tile-above-heading | anti-slop-design.md | BAN: Icon-Tile-Above-Heading Cards |
| Gradient text | anti-slop-design.md | BAN: Gradient Text on Headings |
| Dark-glow box-shadows | anti-slop-design.md | BAN: Dark-Glow Box Shadows on Everything |
| Uniform glassmorphism | anti-slop-design.md | BAN: Uniform Glassmorphism on All Cards |
| Metronomic spacing | anti-slop-design.md | BAN: Metronomic Section Spacing |
| Flat type hierarchy | anti-slop-design.md | BAN: Flat Type Hierarchy |
| Nested cards | anti-slop-design.md | BAN: Nested Cards |
| Single font | anti-slop-design.md | BAN: Single Font for Everything |
| Every button is primary | anti-slop-design.md | BAN: Every Button Is Primary |
| Border accent on rounded | anti-slop-design.md | BAN: Border Accent on Rounded Elements |
| Pure black background | anti-slop-design.md | BAN: Pure Black Backgrounds |
| Opacity-as-palette | anti-slop-design.md | BAN: Opacity-as-Palette |
| Content hallucination | content-authenticity.md | BAN: Hallucinated Features and Commands |
| Wrapping everything in cards | post-generation-evaluation.md | Variation Test checklist item |

## Non-Duplication Verification

Rules complement (do not duplicate) existing validator and skills:
- Static validator catches: purple-to-blue gradients, default fonts by name, centered text, uniform spacing, icon grids, SaaS speak, duplicate CTAs, lorem ipsum, placeholder images
- dg-generate skill: references DESIGN.md, flags generic terms, rejects vague requests
- New rules target: structural patterns (icon-tile layout, nested cards, side-tab borders), generation-time DESIGN.md enforcement protocol, content hallucination verification, post-generation self-check habit

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. All 4 rule files have no `paths:` frontmatter, ensuring they load at session start for every conversation
2. Used BAN/PATTERN/WHY/INSTEAD format for anti-slop-design.md and content-authenticity.md
3. Used section-based protocol format for design-system-adherence.md
4. Used checklist format for post-generation-evaluation.md

## Self-Check: PASSED

- All 4 rule files exist in `.claude/rules/`
- SUMMARY.md exists in `.planning/ws1-rules/`
- Commit 9376322 verified (Task 1)
- Commit c9ee7b2 verified (Task 2)
