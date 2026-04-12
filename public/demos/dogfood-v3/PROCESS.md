# Design Guard Dogfood v3 — Process Report

## Product Discovery Findings

Design Guard is a design intelligence CLI and library for AI-generated web design. It solves a specific problem: AI design tools (Google Stitch, Claude, etc.) produce HTML that looks generically "AI-generated" — default fonts like Inter, purple-blue gradients, uniform icon grids, heading hierarchy violations, poor semantic HTML, and colors that drift from the intended design system.

### Key facts discovered:
- **Two npm packages**: `design-guard` (CLI) and `@design-guard/core` (library)
- **238 tests** across 18 test files
- **13 CLI commands**: init, design, discover, generate, build, preview, sync, research, lint, tui, workflow, quota, tokens
- **7 Claude Code skills**: dg-discover, dg-design, dg-generate, dg-build, dg-preview, dg-research, dg-sync
- **8 modular lint rules**: anti-slop detection, heading hierarchy, accessibility, color palette adherence, semantic HTML ratio, duplicate CTA detection, AI-default font detection, icon grid pattern detection
- **2 generators**: Google Stitch MCP and Claude Direct
- **3 output frameworks**: Static HTML, Astro, Next.js App Router
- **W3C DTCG token bridge** for design token interoperability
- **Design Intelligence Agent** (dg discover): researches business model, scrapes existing site, analyzes competitors, builds confidence score before generating
- **Business model**: Free, MIT licensed, open source. NOT a SaaS — no pricing, no accounts, no signup

### The pipeline:
1. Research (dg discover) — understands the business before designing
2. Design (dg design) — generates 8-section DESIGN.md with business context
3. Generate (dg generate) — creates screens via Stitch MCP with prompt guardrails
4. Lint (dg lint) — scores output 0-100 against DESIGN.md
5. Build (dg build) — exports to framework of choice

## Competitor Analysis

### 1. Stylelint + Design Token Plugins
- **What it does**: CSS linting with plugins for design token validation (e.g., carbon-design-system/stylelint-plugin-carbon-tokens, Kong/design-tokens)
- **Strengths**: Mature ecosystem, deep CSS rule coverage, auto-fix capabilities, integrates with CI/CD
- **Weaknesses**: Only lints CSS/SCSS — not HTML structure, not AI-specific patterns, no business-model awareness, no generation pipeline, requires manual configuration per project
- **Differentiation from Design Guard**: Stylelint validates CSS syntax and token usage. Design Guard validates the full output of AI generation — structure, semantics, color adherence, heading hierarchy, and AI-default pattern detection. Different problem spaces.

### 2. Figma Check Designs (AI Linter)
- **What it does**: AI-powered linting inside Figma that suggests design tokens and variables from your system
- **Strengths**: Built into the tool designers already use, AI-powered variable suggestions, real-time feedback
- **Weaknesses**: Figma-only (no CLI, no CI/CD), requires Organization or Enterprise plan, only works on Figma designs — not on generated HTML/CSS output, no awareness of AI-generation artifacts
- **Differentiation from Design Guard**: Figma lints designs pre-code. Design Guard lints generated code post-generation. Complementary, not competing.

### 3. Design Lint (Figma Plugin)
- **What it does**: Open source Figma plugin that finds missing styles — text, fill, stroke, effects
- **Strengths**: Free, open source, simple
- **Weaknesses**: Only detects missing styles, no scoring, no AI-pattern detection, Figma-only
- **Differentiation from Design Guard**: Much narrower scope. Design Guard operates on HTML output with 8 specific lint rules targeting AI generation artifacts.

### Key differentiator
No existing tool specifically targets "AI-generated design slop" as a category. Stylelint validates tokens, Figma plugins validate designs — but nobody validates the output of AI design generators against a structured design system document. Design Guard occupies a new niche: the quality layer between AI generation and production deployment.

## Design Decisions

### Following DESIGN.md strictly
Every design decision was derived from the 8 sections of DESIGN.md. No creative improvisation — the point of this dogfood exercise is to prove that the DESIGN.md format works as a constraint system.

### Color: Only palette hex values
- Used all 8 color roles via CSS custom properties
- No additional colors introduced
- The previous landing page (public/index.html) failed with 6 off-palette colors — this was explicitly avoided

### Typography: Space Grotesk + DM Sans + JetBrains Mono
- Loaded via Google Fonts CDN only
- No fallback to Inter, Poppins, or system sans-serif as primary
- Font sizes match the table in DESIGN.md Section 3

### Layout: Asymmetric bento grid
- DESIGN.md Section 8 says "Don't use standard three-column icon grids as the second page section"
- Used an asymmetric bento grid with mixed card sizes (wide, tall, regular)
- The previous page was flagged for this exact issue

### Terminal mockup as hero
- DESIGN.md Section 8 says "Use the terminal mockup as the hero centerpiece — show the actual workflow"
- Shows real `dg lint` output with realistic error/warning formatting
- Window chrome uses exact colors: #FF5F57, #FEBC2E, #28C840

### Semantic HTML
- Previous page had a div-to-semantic ratio of 84:9
- This page uses: nav, header, main, 5x section, 5x article, aside, footer, ul
- Proper heading hierarchy: single h1, h2 for section titles, h3 for subsections

### Varied CTAs
- Previous page repeated "get started" 3 times
- This page uses: "Quick Start", "See What It Catches", "View on GitHub", "npm i -g design-guard", "npm i @design-guard/core"

## Lint Score Progression

| File | Score | Issues |
|------|-------|--------|
| public/index.html (existing) | 0/100 | 2 errors, 7 warnings |
| public/demos/dogfood-v3/index.html (iteration 1) | 100/100 | 0 errors, 0 warnings |

No iteration cycle was needed. The page passed on the first lint run.

## What Worked

1. **Reading DESIGN.md first and extracting every token** — mapping all colors to CSS variables before writing any HTML eliminated off-palette drift entirely.
2. **Studying the lint rules via the previous page's failures** — the 0/100 score on public/index.html served as a checklist of exactly what to avoid.
3. **The 8-section DESIGN.md format** — it is genuinely useful as a constraint document. Having explicit hex values, exact font names, specific border-radius values, and anti-patterns listed makes it possible to follow mechanically.
4. **The Do's and Don'ts section** — the most actionable part of DESIGN.md. "Don't use standard three-column icon grids" directly informed the bento layout. "Use the terminal mockup as the hero centerpiece" set the entire page structure.
5. **Business context in Section 1** — knowing this is "NOT a SaaS" prevented adding pricing, signup, or login elements that would be wrong for a free open source tool.

## What Didn't Work (or wasn't tested)

1. **No iterative lint-fix cycle needed** — the page scored 100/100 immediately, which means the lint-fix loop (the theoretically most important part of the exercise) was never exercised. This could mean: (a) following DESIGN.md closely enough prevents issues entirely, or (b) the lint rules could be stricter.
2. **The lint rules may not catch everything** — a perfect score doesn't mean perfect design. Visual quality, layout creativity, content hierarchy, and overall aesthetics are not linted. The tool catches structural and token-level issues but not subjective design quality.
3. **No real user testing** — the page was built by an AI following rules written by a human. Real users clicking through it may find issues the linter doesn't flag.

## Honest Assessment of the Tool

Design Guard solves a real problem. AI-generated HTML has consistent, detectable failure patterns — default fonts, off-palette colors, heading skips, div soup, repetitive CTAs, and uniform icon grids. Having a CLI that catches these before deployment is genuinely useful.

The DESIGN.md format works well as both a human-readable design spec and a machine-readable constraint document. The 8-section structure with explicit Do's and Don'ts is the strongest part — it gives AI generators (and human developers) clear guardrails.

The Design Intelligence Agent (dg discover) is an ambitious feature. Business-model-aware design — knowing that a grocery chain needs a store locator, not a shopping cart — is the kind of context that typically requires a human designer. Automating that discovery phase is a meaningful differentiator.

The competitive landscape supports the product positioning. Stylelint and Figma plugins lint CSS and designs respectively. Design Guard lints AI-generated HTML output — a different and increasingly relevant problem space as AI design tools like Google Stitch expand (550 generations/month as of March 2026).

The 238-test suite and CI pipeline suggest engineering maturity beyond a typical side project.

Areas for improvement:
- The linter could be stricter — catching more subtle AI patterns (cookie-cutter section heights, overly symmetrical padding, generic hero copy patterns)
- A score of 100/100 on a first attempt suggests the ceiling may be too low
- Visual regression testing (screenshot comparison) would complement structural linting
- The tool would benefit from a "design quality" score separate from the "anti-slop" score
