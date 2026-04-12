# Landing Page AI Slop Audit

**File**: `public/index.html`
**Audited against**: `DESIGN.md` Section 8 (Do's and Don'ts) + 35-point slop checklist
**Date**: 2026-04-11

---

## Summary

The landing page avoids the most egregious AI slop patterns (no purple-to-blue gradient, no three-column icon grid as second section, no stock photos, no pricing/login). However, it has significant DESIGN.md violations and several subtler AI-generated patterns that the current linter does not catch. 17 issues found total: 5 DESIGN.md violations, 6 slop patterns the linter misses, and 6 structural/accessibility gaps.

---

## DESIGN.md Section 8 Violations

### VIOLATION: Inter used as primary body font (Don't #1)

DESIGN.md Don't: "Don't use Inter, Poppins, or system sans-serif as the primary font"
DESIGN.md Section 3 specifies body font as "DM Sans".

The page sets `font-family: 'Inter', sans-serif` on the `<body>` element (line 97) and configures Inter as the `font-body` in Tailwind (line 86). Inter appears everywhere that doesn't explicitly use `headline` or `mono`. This is the single largest DESIGN.md violation -- the body text across the entire page uses the wrong font family.

The DESIGN.md Section 3 font stack is: Heading = Space Grotesk, Body = DM Sans, Mono = JetBrains Mono. DM Sans is loaded in the Google Fonts link (line 16) but never actually applied.

**Linter gap**: The `no-default-fonts` rule DOES check for Inter, but it has an exception: "unless explicitly specified in DESIGN.md." Since the DESIGN.md mentions Inter in the font import URL context, this could produce a false negative. The rule should cross-reference which ROLE (heading/body/mono) the font is assigned to, not just whether the name appears somewhere in the document.

### VIOLATION: Material Symbols used instead of Lucide icons (Don't implicit / Section 6)

DESIGN.md Section 6 specifies: "Lucide icons, 24px default, 1.5px stroke, outline style."

The page uses Google Material Symbols Outlined throughout (loaded at lines 17-18, used in stats strip, features, etc.). This is a complete icon library mismatch. Material Symbols are filled/variable-weight Google icons, not the thin-stroke Lucide icons specified in the design system.

**Linter gap**: No rule checks icon library adherence.

### VIOLATION: Color palette is M3 dynamic theme, not DESIGN.md palette

DESIGN.md Section 2 defines 8 named colors: Guard Purple (#6C5CE7), Neon Cyan (#00CEC9), Hot Pink (#FD79A8), Void Black (#0F0F1A), Cloud White (#E8E8F0), Pure White (#FFFFFF), Smoke (#2D2D3F), Glass White (rgba).

The page uses a Material Design 3 dynamic color scheme with 40+ tokens (lines 25-76). The actual hex values do not match:
- DESIGN.md primary: `#6C5CE7` -- Page primary: `#aca3ff` (much lighter/more pastel)
- DESIGN.md secondary: `#00CEC9` -- Page secondary: `#5af9f3` (brighter/more saturated)
- DESIGN.md surface: `#0F0F1A` -- Page surface: `#0d0d18` (close but not exact)
- DESIGN.md on-surface: `#E8E8F0` -- Page on-surface: `#e9e6f7` (close but not exact)

The M3 palette generates colors the DESIGN.md never defined (tertiary purples, error containers, inverse surfaces, etc.). The `color-adherence` rule should catch this, but because the page uses Tailwind semantic classes (e.g., `text-primary`, `bg-surface`) rather than inline hex values, the rule's style-string regex may not extract them.

**Linter gap**: The `color-adherence` rule only extracts hex values from inline styles. It does not parse Tailwind config objects or class-based color references.

### VIOLATION: Heading colors are not Pure White

DESIGN.md Section 2 specifies heading color as "Pure White #FFFFFF". The page headings use `text-on-surface` which maps to `#e9e6f7` -- a slightly warm off-white. This is visible in the h1, h2, and h3 elements.

**Linter gap**: No rule validates heading-specific color assignments.

### VIOLATION: Stats strip as second section (Don't #7 adjacent)

DESIGN.md Don't: "Don't use standard three-column icon grids as the second page section."

The stats strip (lines 177-208) is the second section after the hero. It is a four-column grid with Material icons + stat numbers. While it has 4 columns (not 3), and uses stat numbers (not just icons), it is structurally similar to the prohibited pattern -- a uniform grid of icon+text cards as the immediate second section. The `no-icon-grid` rule only triggers on exactly 3 icons + a grid class, so this 4-column variant slips through.

**Linter gap**: The `no-icon-grid` rule is too narrow -- it only checks for exactly 3 icons. Should detect any uniform icon+text grid pattern as the second major section.

---

## AI Slop Patterns (Not Caught by Linter)

### 1. Triple "Get Started" buttons

The page contains THREE separate "Get Started" buttons:
- Nav bar (line 128): "Get Started"
- Hero section (line 144): "Get Started"
- CTA section (line 350): "Get Started"

All link to the same URL. This is a classic AI generation pattern where the model drops the same generic CTA repeatedly without varying the language. Better alternatives: nav could say "Quick Start", hero could say "Install Now", CTA could say "Read the Docs".

**Proposed new rule**: `no-duplicate-ctas` -- Flag when the same CTA text appears 3+ times on a single page.

### 2. Generic SaaS language

DESIGN.md Don't: "Don't use generic SaaS language ('revolutionize your workflow', 'seamless integration')"

Several phrases on the page lean generic:
- "pixel-perfect screens" (line 288) -- overused AI-generated phrase
- "high-fidelity Stitch components automatically" (line 242) -- SaaS marketing speak
- "record time" (line 268) -- vague filler phrase
- "production-ready" (line 258) -- generic but borderline acceptable for dev tools

The `business-alignment` rule checks for e-commerce/locator mismatches but does NOT flag generic marketing language.

**Proposed new rule**: `no-saas-speak` -- Flag phrases like "seamless", "revolutionize", "transform your workflow", "pixel-perfect", "in record time", "cutting-edge", "state-of-the-art", "next-generation" when they appear in marketing copy.

### 3. Glassmorphism overuse (every card is identical)

Every single card on the page uses the same `glass-card` class: `background: rgba(36, 36, 52, 0.4); backdrop-filter: blur(12px)`. This includes:
- Stats strip cards (4 cards)
- Feature bento cards (4 cards)
- How-it-works step cards (3 cards)
- Command showcase cards (6 cards)

That is 17 glass cards with zero visual variation. This is a hallmark AI pattern: find one effect that looks good, apply it uniformly everywhere. The DESIGN.md itself says "Use glassmorphism cards consistently for content sections" but "consistently" does not mean "identically on every element."

**Proposed new rule**: `no-uniform-components` -- Flag when the same component class is applied to 10+ elements without any variation in styling, border color, background treatment, or sizing.

### 4. Decorative gradient orb (AI ambient decoration)

Lines 107-109 and 153 use a `gradient-orb` element -- a blurred radial gradient positioned as an ambient background decoration. This is an extremely common pattern in AI-generated landing pages. DESIGN.md Section 7 does mention "Animated gradient orbs (purple-to-cyan) as decorative elements" so this is technically sanctioned, but the implementation is static (no animation) and the color is purple-to-cyan-tinted, which overlaps with the prohibited "purple-to-blue gradient" territory.

The `no-slop-gradients` rule only checks for literal purple-to-blue in gradient CSS. It does not flag the decorative blurred-orb pattern.

**Proposed new rule**: `no-ambient-orbs` -- Flag large blurred decorative gradient elements used purely for ambient effect, especially with purple/blue/cyan color combinations.

### 5. All sections centered, same spacing rhythm

Every section uses `max-w-7xl mx-auto px-8 mb-32`. There is zero variation in section spacing:
- Hero: `mb-32`
- Stats: `mb-32`
- Features: `mb-32`
- How-it-works: `py-32 mb-32`
- Commands: `mb-32`
- CTA: `mb-32`

This creates a metronomic rhythm with no visual breathing room or intentional emphasis. Good design varies spacing to create hierarchy -- more space before important sections, less between tightly related ones.

**Proposed new rule**: `no-uniform-spacing` -- Flag when 4+ consecutive sibling sections use identical margin/padding values.

### 6. Fake terminal mockup with unrealistic output

Lines 155-173 show a terminal with three commands (`dg discover`, `dg generate`, `dg build`) that all "complete" instantly in sequence. The output messages are unrealistically brief and clean. While DESIGN.md sanctions terminal mockups, the content feels like a demo script rather than real output. The blinking cursor (line 169-171) uses `animate-pulse` which AI tools commonly use as a generic "loading" indicator.

Not directly lintable, but worth noting as a content authenticity issue.

---

## Structural / Accessibility Issues

### 1. Duplicate stylesheet import

Lines 17-18 load the exact same Material Symbols stylesheet twice:
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:..." rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:..." rel="stylesheet"/>
```

**Proposed new rule**: `no-duplicate-resources` -- Flag duplicate `<link>` or `<script>` elements with identical `href`/`src`.

### 2. No semantic HTML5 landmarks

The page uses `<nav>`, `<main>`, `<section>`, and `<footer>` correctly at the top level. However, sections lack `aria-label` or `aria-labelledby` attributes. Screen readers cannot distinguish between the 6 unnamed `<section>` elements. The `<img>` on line 234 uses `data-alt` instead of `alt` -- this is NOT a valid attribute and provides zero accessibility.

**Linter gap**: The `alt-text` rule checks for `img:not([alt])` but `data-alt` is not `alt`. The image at line 234 has no `alt` attribute but has a `data-alt`, so it would be caught correctly by the rule. However, the rule should also flag `data-alt` as a known anti-pattern (AI tools sometimes generate this).

### 3. Copy button has no aria-label

Line 347: `<button class="material-symbols-outlined ...">content_copy</button>` has no `aria-label`, no `title`, and its text content is the Material Symbols ligature text "content_copy" which is not meaningful to screen readers.

**Proposed new rule**: `no-unlabeled-buttons` -- Flag `<button>` elements whose only text content is an icon ligature, icon class, or SVG without `aria-label`.

### 4. Tailwind CDN loaded without async/defer

Line 15: `<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>` is render-blocking. No `async` or `defer` attribute.

**Proposed new rule**: `no-blocking-scripts` -- Flag external `<script>` elements without `async` or `defer`.

### 5. Missing Open Graph locale and Twitter meta tags

The page has `og:title`, `og:description`, `og:image`, `og:url`, `og:type` but is missing:
- `og:locale`
- `twitter:title`
- `twitter:description`

Minor, but indicates AI-generated boilerplate that was not completed.

### 6. Anchor ID placement creates scroll offset issues

Line 212: `<span id="features"></span>` is placed INSIDE the h2, not on the section. Line 267: `<h2 id="how-it-works">` is on the h2 itself. Inconsistent anchor placement. The `features` anchor will scroll to a point obscured by the fixed navbar.

---

## Linter Rule Gap Summary

Current rules that PASSED (correctly or via blind spots):
| Rule | Result | Notes |
|------|--------|-------|
| `empty-body` | Pass | Body has content |
| `no-default-fonts` | Likely false pass | Inter IS used as body font, but DESIGN.md mentions "Inter" in font import context, which may trigger the intentional-use exception |
| `no-slop-gradients` | Pass | No literal purple-to-blue gradient in CSS |
| `heading-hierarchy` | Pass | h1 -> h2 -> h3 sequence is correct |
| `alt-text` | Should flag 1 | Image at line 234 has `data-alt` but no `alt` |
| `color-adherence` | Likely false pass | Colors are in Tailwind config JS object, not inline styles |
| `no-icon-grid` | Pass | Second section has 4 icon cards, rule only triggers on exactly 3 |
| `business-alignment` | Pass | No e-commerce/locator mismatch |

**New rules needed** (ordered by impact):

1. **`no-saas-speak`** -- Flag generic AI marketing phrases in text content
2. **`no-duplicate-ctas`** -- Flag identical CTA text appearing 3+ times
3. **`no-uniform-spacing`** -- Flag metronomic section spacing with zero variation
4. **`no-uniform-components`** -- Flag 10+ elements with identical styling class
5. **`no-unlabeled-buttons`** -- Flag buttons with only icon content and no aria-label
6. **`no-duplicate-resources`** -- Flag duplicate link/script elements
7. **`no-blocking-scripts`** -- Flag render-blocking external scripts
8. **`no-data-alt`** -- Flag `data-alt` as a known AI anti-pattern (should be `alt`)
9. **`icon-library-adherence`** -- Check icon library matches DESIGN.md Section 6 specification
10. **`no-ambient-orbs`** -- Flag large blurred decorative gradient blobs

**Existing rules that need fixes**:

1. **`no-default-fonts`** -- Should check which ROLE (heading/body/mono) a font is assigned to in DESIGN.md, not just whether the font name appears anywhere in the document
2. **`no-icon-grid`** -- Should detect any uniform icon+text grid (not just exactly 3 icons) as a second section
3. **`color-adherence`** -- Should parse Tailwind config objects and class-based color references, not just inline hex values in style strings

---

## DESIGN.md Do's Checklist

| Do | Status |
|----|--------|
| Use terminal mockup as hero centerpiece | Done |
| Display real CLI commands with copy-to-clipboard | Partial -- copy button exists but no JS handler, only on install CTA |
| Show slash commands as interactive elements | Done -- command showcase section |
| Use glassmorphism cards consistently | Done (overused -- see slop finding #3) |
| Keep dark background throughout | Done -- no light sections |
| Use Neon Cyan for links and interactive code | Partial -- uses #5af9f3 (close but not #00CEC9) |
| Include GitHub star count and npm install prominently | Missing GitHub star count; npm install is present |
| Use monospace for commands/paths/technical terms | Done |
| Subtle glow on interactive elements | Done -- hover glows on buttons |

## DESIGN.md Don'ts Checklist

| Don't | Status |
|-------|--------|
| Don't use Inter/Poppins as primary font | **VIOLATED** -- Inter is primary body font |
| Don't use purple-to-blue gradients | Pass -- uses purple-to-cyan |
| Don't add pricing/signup/login | Pass |
| Don't use light backgrounds for main content | Pass |
| Don't use photography/realistic illustrations | Pass |
| Don't use uniform border-radius (>16px) on all elements | Borderline -- mix of rounded-xl (12px), rounded-2xl (16px), rounded-3xl (24px on CTA) |
| Don't use three-column icon grid as second section | Borderline -- four-column stats grid as second section |
| Don't include testimonials with stock headshots | Pass |
| Don't use generic SaaS language | **VIOLATED** -- "pixel-perfect", "record time" |
| Don't use hamburger menu on desktop | Pass -- nav items visible on md+ |
