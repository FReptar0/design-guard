# Dogfood Report: Stitch MCP v3 Landing Page

## Product Understanding

Design Guard is an open-source CLI tool and npm library (`design-guard` + `@design-guard/core`) that validates AI-generated web designs against design systems. It catches "AI slop" -- wrong fonts, off-palette colors, broken heading hierarchy, generic layouts -- and scores HTML 0-100. It also generates designs via Google Stitch MCP and builds sites in Static HTML, Astro, or Next.js.

Key stats: 13 CLI commands, 238 tests, 8 lint rules, 7 Claude Code skills, 2 npm packages.

## Competitors Researched

1. **drift-guard** -- CLI that locks design tokens and DOM structure before AI agents modify code. Focuses on prevention (locking tokens) vs Design Guard's approach of detection + scoring. 130 tests, Node 18/20/22.
2. **AI-SLOP-Detector** -- Python-based code quality linter that catches AI-specific anti-patterns (hallucinated imports, placeholder code). Code-focused, not design-focused.
3. **slopless.design** -- Design-specific slop detection. Web-based, not CLI-first.

Design Guard's unique position: combines business research, design system generation, AI generation via Stitch MCP, anti-slop linting, AND multi-framework build in one tool.

## Confidence Score (dg-discover protocol)

| Dimension | Score |
|-----------|-------|
| Business model | 95% |
| Website purpose | 95% |
| Audience | 90% |
| Visual identity | 95% |
| Competitive | 75% |
| **Weighted average** | **~90%** |

## Exact Prompt Sent to Stitch

```
A dark, futuristic landing page for "Design Guard," an open-source CLI tool and npm
library that validates AI-generated web designs against design systems. It catches AI
slop -- wrong fonts, off-palette colors, broken heading hierarchy, generic layouts --
and scores HTML 0-100. It also generates designs via Google Stitch MCP and builds
sites in Static HTML, Astro, or Next.js. Two npm packages: `design-guard` (CLI) and
`@design-guard/core` (library). Free, MIT licensed. NOT a SaaS -- no pricing, no signup.

Target audience: developers and designers using AI design tools who want quality control
over generated output.

Background: Void Black #0F0F1A throughout. No light sections.

Include these sections:

1. HERO -- Full-width with a terminal mockup as the centerpiece showing a realistic `dg`
   CLI session (commands like `dg discover`, `dg generate`, `dg lint`). Large heading
   "Design websites with AI. Ship them with confidence." in Space Grotesk. Subtext:
   "Design Guard turns Google Stitch into a full design-to-deploy pipeline. Generate
   screens, lint for AI slop, and export to your favorite framework -- all from the
   terminal." Two CTAs: primary purple button "Install from npm" and secondary outline
   button "View on GitHub". Below: a stats strip showing "13 CLI commands", "238 tests",
   "8 lint rules", "3 frameworks".

2. PROBLEM STATEMENT -- Asymmetric two-column layout. Left: large heading "AI design
   tools generate slop." with body text explaining the problem. Right: before/after
   visual -- "Score: 23/100" failing card vs "Score: 94/100" passing card.

3. FEATURES BENTO -- A bento grid (not uniform icon grid) with 5 cards of varying sizes:
   (a) Large: "Design Intelligence Agent", (b) "Anti-Slop Linter", (c) "Multi-Generator",
   (d) "DTCG Token Bridge", (e) "Framework Build". Glassmorphism cards.

4. HOW IT WORKS -- 5-step horizontal pipeline: Research -> Design -> Generate -> Lint ->
   Build. Each step is a glass card with icon, title, description, and CLI command.

5. COMMANDS -- Two-column showcase. Left: 13 CLI commands. Right: 7 Claude Code skills.
   Monospace code-block styling.

6. INSTALL CTA -- Centered with `npm i -g design-guard` and `npm i @design-guard/core`.
   Purple glow. GitHub star button.

7. FOOTER -- Minimal. "Built by Fernando Rodriguez Memije" with links. MIT License.
   "Built with Design Guard" signature.
```

## What Stitch Generated

Stitch (GEMINI_3_1_PRO, DESKTOP) generated a 350-line HTML file with:

**What it got right:**
- Dark theme throughout (#0F0F1A background)
- Space Grotesk for headings, DM Sans for body, JetBrains Mono for code
- Correct primary color #6C5CE7 used for buttons and accents
- Terminal mockup with realistic CLI output in hero
- Glassmorphism cards with backdrop-filter blur
- Before/after scoring cards (23/100 vs 94/100)
- 5-step pipeline layout with connected glass cards
- Stats strip with correct numbers (13, 238, 8, 3)
- Install CTA with npm commands and purple glow effect
- Footer with "Built with Design Guard" signature
- Tailwind CSS with proper custom theme configuration matching DESIGN.md
- Material Symbols Outlined icons (consistent with Lucide-like outline style)
- Proper responsive design with md: breakpoints

**What it got wrong (required manual fixes):**
- Terminal window chrome used off-palette colors (#FF5F56, #FFBD2E, #27C93F)
- Heading hierarchy skipped h2 -> h4 in How It Works section
- Used `data-alt` instead of `alt` on image (accessibility)
- Hallucinated 6 CLI commands that don't exist (fix, audit, bridge, theme, component, login)
- Hallucinated 5 Claude Code skills that don't exist (lint, fix, bridge, audit, scaffold)
- Almost no semantic HTML -- 96 divs vs 9 semantic elements
- Missing meta description tag
- Copyright year set to 2024 instead of 2026
- Called skills "Claude Code Commands" instead of "Claude Code Skills"

## DESIGN.md Compliance Assessment

| Category | Compliance | Notes |
|----------|-----------|-------|
| Color palette | ~90% | Used palette colors correctly except terminal chrome dots |
| Typography | 100% | Space Grotesk, DM Sans, JetBrains Mono all loaded and used |
| Dark theme | 100% | No light sections anywhere |
| Glassmorphism | 100% | Glass cards with backdrop-blur throughout |
| Terminal mockup | 100% | Hero centerpiece with fake window chrome |
| Code blocks | 95% | Correct Smoke bg, monospace font |
| No pricing/signup | 90% | Had "dg login" command which implies auth |
| Component patterns | 85% | Buttons, cards, code blocks match spec |
| Iconography | 90% | Material Symbols (outline, similar to Lucide) |

## Lint Score Progression

| Iteration | Score | Errors | Warnings |
|-----------|-------|--------|----------|
| Baseline (old page) | 0/100 | 2 | 7 |
| Raw Stitch output | 0/100 | 3 | 4 |
| After fixes | 90/100 | 0 | 1 |
| After grid refinement | 90/100 | 0 | 1 |

## Manual Fixes Needed (10 categories)

1. **Meta description** -- Added missing tag
2. **Heading hierarchy** -- h4 -> h3 (5 elements)
3. **Accessibility** -- data-alt -> alt on image
4. **Off-palette colors** -- 3 terminal chrome colors replaced with palette equivalents
5. **Auth/login removal** -- "dg login" -> "dg tokens"
6. **Hallucinated commands** -- 6 fake CLI commands replaced with 6 real ones
7. **Hallucinated skills** -- 5 fake slash commands replaced with 5 real ones
8. **Semantic HTML** -- 20+ divs converted to article, figure, figcaption, header, pre/code, ul/li, aside
9. **Copyright year** -- 2024 -> 2026
10. **Heading text** -- "Claude Code Commands" -> "Claude Code Skills"

## Honest Assessment: Stitch Value vs Effort of Fixing

### What Stitch provided (significant value)
- Full visual design in one generation: dark theme, glassmorphism, terminal aesthetic
- Tailwind config with correct custom colors, fonts, and border-radius
- 7 well-structured sections with proper spacing and responsive breakpoints
- Terminal mockup component with realistic output formatting
- Before/after scoring visualization
- 5-step pipeline with connecting line
- Install CTA with glowing effect
- Proper Google Fonts loading for all 3 font families
- Professional visual quality -- this looks like a real developer tool landing page

### What I had to fix manually (moderate effort, ~30 minutes)
- Content accuracy: hallucinated commands/skills were the biggest issue
- Semantic HTML: divs everywhere, no articles/figures/etc.
- Accessibility: data-alt instead of alt
- Minor palette deviations: terminal chrome colors

### Verdict

**Stitch + DESIGN.md + design system = strong starting point (90% of visual design done automatically).**

The design system integration worked extremely well -- Stitch respected the color palette, fonts, dark mode, and component patterns almost perfectly. The DESIGN.md fed through the design system's `designMd` field clearly influenced the generation.

The remaining 10% of work was:
- **Content hallucination** (biggest problem): Stitch invented plausible-sounding but wrong CLI commands and skills. This is the core "AI slop" problem Design Guard exists to solve.
- **Semantic HTML** (systemic): Stitch generates div-heavy markup. This is consistent across all AI generators.
- **Small accessibility gaps**: data-alt instead of alt is a known Stitch pattern.

**Bottom line**: For a developer tool landing page, Stitch generated 90% of the visual design correctly in one shot. The lint->fix cycle caught everything that needed correction. The combination of Stitch generation + Design Guard linting is genuinely useful -- the linter found real issues I would have missed in manual review (heading hierarchy, off-palette colors, login reference on a free tool).

Time breakdown:
- Research + confidence scoring: ~10 min
- Stitch project + design system setup: ~5 min
- Generation: ~2 min
- Lint + fix cycle: ~30 min
- Total: ~47 min for a production-quality landing page from nothing
