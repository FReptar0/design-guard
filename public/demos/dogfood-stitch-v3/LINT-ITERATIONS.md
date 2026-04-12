# Lint Iterations -- dogfood-stitch-v3

## Baseline: Existing public/index.html
- **Score: 0/100**
- 2 errors, 7 warnings
- Issues: Inter font (AI default), heading skip h2->h4, data-alt without alt, 6 off-palette colors, 4-icon grid, 4-icon grid in section 3, repeated "get started" CTA, div-to-semantic ratio 84:9, missing meta description

## Iteration 1: Raw Stitch Output
- **Score: 0/100**
- 3 errors, 4 warnings
- Issues found:
  - ERROR: Heading hierarchy skip h2 -> h4 (How It Works steps used h4 instead of h3)
  - ERROR: 1 image has data-alt but no alt attribute (Design Intelligence Agent card)
  - ERROR: 3 off-palette colors: #FF5F56, #FFBD2E, #27C93F (terminal window chrome dots)
  - ERROR: Login/signup elements detected ("dg login" command listed)
  - WARNING: Section 3 contains a uniform 5-icon grid
  - WARNING: Div-to-semantic ratio 96:9 (>5:1)
  - WARNING: Missing meta description

## Iteration 2: First Fix Pass
Fixes applied:
1. Added `<meta name="description">` tag
2. Changed all h4 -> h3 in How It Works section (heading hierarchy)
3. Changed `data-alt` to `alt` on image (accessibility)
4. Replaced terminal chrome colors (#FF5F56, #FFBD2E, #27C93F) with palette colors (#FD79A8, #E8E8F0, #00CEC9)
5. Replaced "dg login" with "dg tokens" (removed login/auth reference)
6. Replaced hallucinated CLI commands (fix, audit, bridge, theme, component, help) with real ones (preview, sync, research, tokens, tui, workflow, quota)
7. Fixed hallucinated Claude Code skills (lint, fix, bridge, audit, scaffold) with real ones (design, generate, build, preview, research)
8. Converted 20+ structural divs to semantic HTML: figure, figcaption, article, header, pre/code, ul/li, aside
9. Fixed copyright year 2024 -> 2026
10. Changed "Claude Code Commands" heading to "Claude Code Skills"

- **Score: 90/100** (from 0)
- 0 errors, 1 warning
- Remaining: Section 3 uniform 5-icon grid warning (cosmetic)

## Iteration 3: Bento Grid Refinement
Fixes applied:
1. Changed features grid from 3-column to 12-column for true bento asymmetry
2. Card spans: 7+5 on first row, 4+4+4 on second row

- **Score: 90/100** (unchanged)
- 0 errors, 1 warning
- Remaining: Same 5-icon grid warning -- linter counts material-symbols-outlined icons in grid, structural detection limit

## Final Score: 90/100
Target was 70. Exceeded by 20 points.
