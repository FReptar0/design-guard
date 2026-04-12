# Design Guard Anti-Slop Audit Report

**Date**: 2026-04-12
**Auditor**: Ruthless independent audit
**Scope**: All 8 lint rules in `packages/core/src/validation/rules/`, scoring system, test fixtures, and live output

---

## Executive Summary

The anti-slop validation system currently catches approximately **15-20% of common AI-generated design slop patterns**. It has 8 rules, of which only 3 target actual slop detection (`no-default-fonts`, `no-slop-gradients`, `no-icon-grid`). The remaining 5 are basic structural/accessibility checks that any HTML linter could provide. The system is marketed as a "Proprietary heuristics engine" but is closer to a proof-of-concept with massive blind spots. A page riddled with AI slop can easily score 90-100/100.

**Coverage by category**:
- Typography slop: ~10% covered (flags 2 fonts and Tailwind font-sans; misses everything else)
- Color slop: ~15% covered (palette drift only, and only if >3 off-palette colors; no contrast, no lazy-gray, no opacity abuse)
- Layout slop: ~5% covered (icon grid only; misses centered-everything, no-max-width, no-responsive, uniform spacing)
- Component slop: ~5% covered (icon grid only; misses generic cards, generic CTAs, generic hero, generic footer)
- Content slop: 0% covered (no detection of lorem ipsum, placeholder text, generic SaaS language, or fake testimonials)
- Structural slop: ~15% covered (empty body, heading hierarchy; misses div soup, missing meta/lang, no semantic HTML)

---

## Part 1: Rule-by-Rule Analysis

### Rule 1: `empty-body` (error, structure)

**What it catches**: Completely empty `<body>` tag with zero child elements and zero text.

**What it misses**:
- A body with a single `<div></div>` passes (has a child element but no content)
- A body with only whitespace text nodes passes
- A body containing only `<style>` or `<script>` tags passes (text content from those counts)

**Severity assessment**: Appropriate as error. But the check is too lenient. Useful only for detecting total generation failures, not slop.

---

### Rule 2: `no-default-fonts` (warning, slop)

**What it catches**:
- `Inter` font in CSS (unless in DESIGN.md)
- `Poppins` font in CSS (unless in DESIGN.md)
- Tailwind `font-sans` class (info level)

**What it misses**:
- `Roboto` -- the single most overused Google Font on the web. Not flagged.
- `Open Sans` -- another massively overused default. Not flagged.
- `Lato`, `Montserrat`, `Nunito`, `Raleway` -- all common AI defaults. Not flagged.
- `system-ui`, `-apple-system`, `BlinkMacSystemFont` generic font stacks without intentional choice
- `sans-serif` used alone as the font-family (the absolute laziest option)
- Missing `font-family` declaration entirely (browser default)
- Tailwind `font-serif`, `font-mono` defaults (same lazy problem)
- No check for `@import` or `<link>` tags loading the flagged fonts from Google Fonts (only checks CSS `font-family` declarations)

**The DESIGN.md bypass is fragile**: It does a simple `designMdContent.includes(font)` string match. If DESIGN.md says "Don't use Inter" the rule will see "Inter" in the content and suppress the warning. This is a false-negative bug.

---

### Rule 3: `no-slop-gradients` (warning, slop)

**What it catches**: Purple-to-blue gradients using either color keywords (`purple`, `blue`) or hex values where the first byte is `#[89a-f]` (purple range) paired with `#[0-5]` (blue range).

**What it misses**:
- The regex is too specific. It only checks two hex digit ranges and misses common purple-blue hex combos like `#7c3aed` to `#3b82f6` (Tailwind violet-600 to blue-500) -- `#7c` starts with `7` which fails the `[89a-f]` first-character check
- Pink-to-purple gradients (equally common AI slop)
- Blue-to-teal gradients (extremely common)
- Any gradient using `rgb()`, `rgba()`, `hsl()`, or CSS color names beyond "purple" and "blue"
- Gradient classes in Tailwind (`bg-gradient-to-r from-purple-500 to-blue-500`) -- these appear in class attributes, not in `<style>` tags, so `allStyles` never sees them
- Multiple identical gradients (still reports only one issue)
- The project's own DESIGN.md says "Don't use purple-to-blue gradients (use purple-to-cyan instead)" but the current landing page (`public/index.html`) uses `radial-gradient(circle, rgba(172, 163, 255, 0.15) 0%, rgba(90, 249, 243, 0.05) 100%)` which is literally a purple-to-cyan gradient -- this rule cannot distinguish "approved" from "sloppy" gradients

---

### Rule 4: `heading-hierarchy` (warning, structure)

**What it catches**: First heading level skip (e.g., h1 directly followed by h4).

**What it misses**:
- Only reports the FIRST skip, then breaks. A page with h1->h4->h6 only reports h1->h4
- Does not check if h1 exists at all (a page starting with h3 passes)
- Does not check for multiple h1 tags (common AI slop -- every section gets an h1)
- Does not check for headings used purely for styling (h1 with font-size: 14px)
- Does not check heading levels going back UP incorrectly (h1->h2->h3->h1->h4 -- the second h1->h4 skip won't be caught because it breaks after the first valid sequence)

Actually, re-reading the code: it reports only the first skip across the ENTIRE page. So `h1->h2->h3->h1->h4` would report `h3->h1` as a negative skip... wait, no. `headings[i] > headings[i-1] + 1` -- going from h3 (3) to h1 (1) means 1 > 3+1 = 4, which is false. So that transition is fine. But h1 (1) to h4 (4) means 4 > 1+1 = 2, which is true. So it would catch that second skip. But only the first one across the whole document is reported.

---

### Rule 5: `alt-text` (error, accessibility)

**What it catches**: `<img>` elements without `alt` attribute.

**What it misses**:
- Empty alt attributes (`alt=""`) -- technically valid for decorative images, but AI generators use this to bypass the check while providing no accessibility value
- Alt text that is just the filename (`alt="IMG_2847.jpg"`)
- Alt text that is generic placeholder (`alt="image"`, `alt="photo"`, `alt="icon"`)
- Alt text generated by AI that describes the wrong thing
- Missing alt on `<input type="image">`, `<area>`, SVG `<img>` embeds
- `role="img"` elements without `aria-label`
- Background images with text overlay (no alt possible, needs alternative)
- The `data-alt` attribute pattern used in the landing page (`data-alt="abstract neural network..."`) -- these Stitch-generated images use `data-alt` instead of `alt`, which means the alt text is NOT accessible. The rule should flag images with `data-alt` but no `alt`.

---

### Rule 6: `color-adherence` (warning, color)

**What it catches**: When more than 3 hex colors in `<style>` tags/inline styles don't appear in DESIGN.md's palette, excluding "neutral" colors (R/G/B channels within 20 of each other).

**What it misses**:
- **Threshold is too generous**: 3 off-palette colors are allowed before a warning triggers. That means a page can use 3 completely random brand-violating colors and pass clean.
- **Only checks hex `#RRGGBB` format**: Misses `rgb()`, `rgba()`, `hsl()`, CSS color keywords (`red`, `green`, `navy`), `oklch()`, shorthand hex (`#RGB`)
- **The neutral color exemption is too broad**: `maxDiff < 20` means colors like `#666666`, `#999999`, `#cccccc` are all considered "neutral" and exempt. But this is exactly the "I didn't think about colors" gray palette that screams AI slop.
- **Does not check Tailwind classes**: Colors specified via `text-red-500`, `bg-blue-600`, etc. in class attributes are invisible to this rule
- **Does not check CSS custom properties**: Colors defined as `var(--some-color)` are not resolved
- **No contrast checking whatsoever**: WCAG AA violations (text on background with insufficient contrast) are not detected
- **Silently skips if no DESIGN.md**: Returns zero issues. This means any page without a DESIGN.md gets a free pass on color quality.
- **Does not flag underdesigned palettes**: A page using only 2 colors total (text and background) would pass. That's a sign of AI laziness.
- **Does not check for opacity abuse**: `rgba(0,0,0,0.1)`, `rgba(0,0,0,0.2)`, `rgba(0,0,0,0.3)` used as lazy shadow/border variants instead of designed palette colors

---

### Rule 7: `no-icon-grid` (info, slop)

**What it catches**: Exactly 3 SVG/icon elements inside a grid/column container in the second `<section>` (or `main > div` or `[class*="section"]`).

**What it misses**:
- Icon grids in ANY position other than the second section
- Icon grids with 2 or 4 icons (only checks for exactly 3)
- Icon grids using `<img>` tags instead of `<svg>` or `<i>` (common with icon libraries)
- Icon grids using emoji as icons
- Feature grids without icons (same sloppy pattern, just text in columns)
- The severity is `info` (-3 points) which is almost meaningless. A page can have this issue and still score 97/100.
- The detection is fragile: it looks for `[class*="icon"]` or `i[class]` which misses Material Symbols `<span>` elements (used heavily in the landing page), Font Awesome `<i>` with `fa-*` classes, and Lucide `<svg>` without icon classes.

---

### Rule 8: `business-alignment` (error, structure)

**What it catches**:
- E-commerce elements (cart/checkout) on non-e-commerce sites (requires DESIGN.md to explicitly say "not e-commerce")
- Missing store locator elements when DESIGN.md mentions store locator

**What it misses**:
- Only checks TWO specific business model mismatches. That's it.
- Requires very specific DESIGN.md phrasing ("not an e-commerce", "not e-commerce", "no online purchasing") -- if someone writes "This is a blog" without mentioning e-commerce, the check is skipped entirely
- Does not check for pricing pages on free/open-source projects
- Does not check for login/signup on projects that don't need auth
- Does not check for "Contact Sales" on B2C sites
- Does not check for testimonials with stock headshots (explicitly banned in the project's DESIGN.md)
- Does not check for SaaS-specific language on non-SaaS sites
- Silently returns empty if no DESIGN.md

---

## Part 2: Missing Rules (Not Implemented At All)

### Typography (0 rules beyond font name checking)

| Pattern | Severity | Description |
|---------|----------|-------------|
| Inconsistent units | warning | Mixing px, rem, em, vw for font sizes within the same page |
| Missing line-height | warning | Text blocks without line-height declarations (browser default 1.2 is too tight) |
| Body text size extremes | warning | Body text < 14px or > 20px |
| Heading scale violations | info | H1-H6 sizes that don't follow a clear typographic scale |
| Missing font-weight variation | info | Entire page uses single weight (usually 400) |
| Text alignment abuse | warning | `text-align: center` on containers/body (AI loves centering everything) |
| Excessive font-families | warning | More than 3 font families loaded |
| Font loading without display swap | info | Google Fonts `<link>` without `&display=swap` |

### Color (0 rules beyond palette drift)

| Pattern | Severity | Description |
|---------|----------|-------------|
| WCAG contrast violations | error | Text/background combos below 4.5:1 (AA) for body, 3:1 for large text |
| Lazy gray palette | warning | More than 3 shades of gray that aren't defined in the design system |
| Opacity-as-palette | warning | More than 5 uses of `rgba()` with same base color at different opacities |
| Underdesigned palette | info | Fewer than 4 distinct hue families used across the page |
| Pure black text (#000000) | info | When DESIGN.md specifies a different text color (the actual DESIGN.md explicitly bans #000000) |

### Layout (0 rules)

| Pattern | Severity | Description |
|---------|----------|-------------|
| No max-width | warning | Text content with no max-width constraint (unreadable on wide screens) |
| Everything centered | warning | More than 60% of text elements have `text-align: center` |
| No responsive breakpoints | warning | No `@media` queries at all in a page >100 lines |
| Uniform spacing | info | Same padding/margin value used more than 10 times |
| Three-column grid dominance | info | Main content pattern is a 3-column grid (not just icons) |

### Content (0 rules)

| Pattern | Severity | Description |
|---------|----------|-------------|
| Lorem ipsum | error | Detected placeholder text (lorem, ipsum, dolor sit amet, etc.) |
| Generic SaaS language | warning | "Transform your workflow", "Seamless integration", "Revolutionize", "Unlock the power" etc. |
| Generic CTA text | info | Buttons saying only "Get Started", "Learn More", "Sign Up" without context |
| "Why choose us" sections | info | Classic AI-generated trust section |
| Numbered feature lists | info | "1. Fast 2. Secure 3. Easy" pattern |
| Fake testimonial detection | warning | Testimonial sections with stock-like names ("John D.", "Sarah M.") |
| Placeholder images | warning | Image sources containing "placeholder", "unsplash.com/random", "picsum" |

### Structural (mostly uncovered)

| Pattern | Severity | Description |
|---------|----------|-------------|
| Missing lang attribute | warning | `<html>` without `lang` attribute |
| Missing viewport meta | warning | No `<meta name="viewport">` tag |
| Missing description meta | info | No `<meta name="description">` tag |
| Div soup | warning | Ratio of `<div>` to semantic elements (`<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<main>`) exceeds 5:1 |
| Missing `<main>` landmark | info | No `<main>` element |
| Duplicate IDs | warning | Same `id` value on multiple elements |
| Inline styles over threshold | info | More than 10 elements with `style` attributes (sign of unstructured CSS) |
| Missing favicon | info | No `<link rel="icon">` |
| No `<title>` | warning | Page has no title element |

---

## Part 3: False Negatives -- Slop That Passes as Clean

### Test: The `competitor-site.html` fixture

This file (`packages/core/tests/fixtures/competitor-site.html`) is a textbook example of AI-generated HTML slop and would likely score **94-100/100** under the current validator:

**Slop patterns present in this file that the validator misses**:

1. **"Why choose us" section** (`<h2>Por que elegirnos?</h2>`) -- Classic AI-generated trust section. Not detected.
2. **Exactly 3-column feature grid with icons** -- BUT the icons are `<img>` tags not `<svg>` or `<i>`, so `no-icon-grid` misses it entirely.
3. **Generic hero: centered text + gradient background** -- AI's favorite hero pattern. Not detected.
4. **Every section is `text-align: center`** -- Every heading, every feature item. Not detected.
5. **Generic 4-column category grid** -- Pattern template filler. Not detected.
6. **Footer with generic links (Privacy, Terms)** -- Not detected.
7. **No responsive design** -- Zero `@media` queries. Not detected.
8. **All images reference nonexistent files** (`icon-fresh.svg`, `cat-frutas.jpg`) -- Placeholder content. Not detected.

**Expected score**: 100/100 (no DESIGN.md loaded in test context, so color-adherence and business-alignment are skipped)

### Test: The actual landing page (`public/index.html`)

This page uses Tailwind CSS extensively. Nearly all styling is in class attributes, not `<style>` tags. This means:

1. **`allStyles` is nearly empty** for the Tailwind portions -- the inline `<style>` block has some custom CSS, but most visual styling is in Tailwind classes
2. **`no-default-fonts` works** because it checks `allStyles` which includes the `<style>` block declaring `font-family: 'Inter', sans-serif` -- but Inter IS in DESIGN.md so it's suppressed
3. **`no-slop-gradients` partially works** -- but the gradient-orb in the `<style>` block is `radial-gradient(circle, rgba(172, 163, 255, 0.15) 0%, rgba(90, 249, 243, 0.05) 100%)` which is NOT a purple-to-blue gradient (it's purple-to-cyan), so it correctly passes
4. **Color adherence is completely blind** to Tailwind classes like `text-[#5af9f3]`, `bg-[#aca3ff]`, `border-[#aca3ff]/15`

**Slop patterns present that would NOT be caught**:
- The landing page has a generic 3-column "How it Works" section with numbered steps (1, 2, 3) -- classic AI layout
- The footer has generic 4-column layout (Product, Community, Connect) -- classic footer slop
- "Get Started" button appears 3 times -- generic CTA text
- `data-alt` instead of `alt` on one image -- accessibility gap not flagged
- Duplicate Google Font `<link>` tags for Material Symbols -- no duplicate resource detection
- The page loads 4 font families (Space Grotesk, Inter, DM Sans, JetBrains Mono) -- excessive for a single page
- Massive Material Design 3 color token system in Tailwind config with 40+ color tokens that have nothing to do with the DESIGN.md palette -- this entire parallel color system is invisible to the validator

---

## Part 4: Scoring Calibration Issues

### Current formula: `score = 100 - (errors * 15) - (warnings * 8) - (info * 3)`

**Problem 1: Info issues are nearly free**
At -3 points each, a page needs 14 info-level issues to fail (score 58). But info is where most slop detections would naturally land. A page with 10 minor but collectively damning slop indicators would score 70 and pass.

**Problem 2: The pass threshold (60) is too low**
60/100 means a page can have 2 errors + 1 warning (100 - 30 - 8 = 62, pass) or 5 warnings (100 - 40 = 60, pass). Five warnings about different design problems is a page with systemic quality issues.

**Problem 3: Warning severity is uniform**
"Poppins font" (-8) and "colors don't match DESIGN.md" (-8) are treated identically, but the second one is far more serious.

**Problem 4: No category weighting**
All categories contribute equally. A page could have 0 slop issues but fail on structure, or have 5 slop issues but pass because they're all info-level.

**Problem 5: Perfect score is too easy**
With only 8 rules and most requiring specific conditions (DESIGN.md must exist, specific font names must be present, exact icon grid pattern must match), a typical AI-generated page will trigger 0-2 rules and score 92-100.

**Problem 6: Score doesn't reflect coverage**
A score of 100/100 implies "this page has no quality issues." In reality it means "this page has no issues among the tiny set we check for." This is misleading to users who trust the score.

### Recommended recalibration:
- Start score at 70 (not 100) when fewer than 15 rules exist -- acknowledge incomplete coverage
- Or: add a "coverage confidence" metric alongside the score
- Raise pass threshold to 75
- Weight slop-category issues higher (-10 for slop warnings vs -8 for structure warnings)
- Add tiered info: "cosmetic" (-2) vs "pattern" (-5) to distinguish trivial hints from slop indicators

---

## Part 5: DESIGN.md Don'ts vs Enforced Rules

The project's own DESIGN.md (Section 8) lists these Don'ts. Let's check enforcement:

| Don't Rule | Enforced? | Notes |
|------------|-----------|-------|
| Don't use Inter, Poppins, or system sans-serif as primary font | PARTIAL | Inter and Poppins checked; `system-ui`, `-apple-system`, `sans-serif` alone are not |
| Don't use purple-to-blue gradients | PARTIAL | Only keyword and narrow hex ranges checked; Tailwind gradient classes missed |
| Don't add pricing, signup, or login elements | NO | Not enforced at all |
| Don't use light backgrounds for main content sections | NO | Not enforced |
| Don't use photography or realistic illustrations | NO | Not enforced |
| Don't use uniform border-radius (>16px) on all elements | NO | Not enforced |
| Don't use standard three-column icon grids as second section | PARTIAL | Only checks for exactly 3 SVG/i elements in second section; too narrow |
| Don't include testimonials with stock headshots | NO | Not enforced |
| Don't use generic SaaS language | NO | Not enforced |
| Don't use a hamburger menu on desktop | NO | Not enforced |

**Result: 2 out of 10 Don'ts are partially enforced. 0 are fully enforced. 8 are completely unenforced.**

The sample-design.md fixture (Acme) also has Don'ts:
- Don't use more than 2 font families per page -- NOT enforced
- Don't use pure black (#000000) for text -- NOT enforced
- Don't center-align body text longer than 2 lines -- NOT enforced
- Don't use rounded corners > 12px (except pills) -- NOT enforced
- Don't use gradients (flat colors only) -- NOT enforced

**0 out of 5 enforced.**

---

## Part 6: Test Fixture Quality

### `business-site.html` (Tiendas 3B)
This is a reasonable fixture for a well-formed page. It would test color adherence against the sample DESIGN.md. However, it's for a DIFFERENT brand (Tiendas 3B) than the sample DESIGN.md (Acme), so color-adherence would always flag it. This seems like a fixture mismatch -- the tests don't actually use it with a DESIGN.md.

### `competitor-site.html` (MercadoFresco)
This is a competitor reference page. It contains multiple slop patterns (see Part 3) but is used as a research/analysis fixture, not as validation input.

### `sample-design.md` (Acme)
A well-formed DESIGN.md with all 8 sections. Good for testing the design-validator but not used in output-validator tests.

### What's missing from fixtures:
- A fixture with MAXIMUM slop (every AI pattern: Inter font, purple-blue gradient, 3-column icon grid, generic CTAs, lorem ipsum, centered everything, no responsive, div soup)
- A fixture representing a "close but sloppy" page that should fail but currently passes
- A fixture with Tailwind CSS classes (the actual use case) instead of vanilla CSS
- A fixture pair: one with DESIGN.md compliance, one without

---

## Part 7: Prioritized Recommendations

### Priority 1: Critical (breaks the value proposition)

1. **Add content slop detection** -- Lorem ipsum, generic SaaS phrases, placeholder images. This is the most user-visible slop and has ZERO coverage. Implementation: regex patterns against `$('body').text()` and img `src` attributes.

2. **Add WCAG contrast checking** -- This is an accessibility fundamental and currently missing. Libraries like `wcag-contrast-ratio` exist. Check all text-on-background combos extracted from the DOM.

3. **Fix the DESIGN.md bypass bug in `no-default-fonts`** -- `designMdContent.includes('Inter')` matches "Don't use Inter" as a positive match. Fix: check if font appears in Section 3 (Typography) specifically, not in the full document.

4. **Add Tailwind awareness** -- The current system is blind to Tailwind classes. Since the project's own landing page and likely all generated output uses Tailwind, this is a critical blind spot. Parse class attributes for Tailwind color, font, spacing, and layout utilities.

### Priority 2: High (significant slop gaps)

5. **Add layout slop rules** -- Detect no-max-width, everything-centered, no-responsive-breakpoints. These are easy to implement and high-impact.

6. **Add structural slop rules** -- Missing lang, missing viewport meta, div soup ratio, missing semantic landmarks. Quick wins with clear detection logic.

7. **Expand font detection** -- Add Roboto, Open Sans, Lato, Montserrat, Nunito, Raleway to the default font list. Also detect `sans-serif` used alone.

8. **Fix color-adherence threshold** -- 3 off-palette colors before warning is too generous. Lower to 1, or make it a percentage of total colors used.

9. **Add generic CTA detection** -- Flag buttons with text matching "Get Started", "Learn More", "Sign Up", "Contact Us" when they're not contextually specific.

### Priority 3: Medium (refinements)

10. **Add DESIGN.md Don'ts enforcement** -- Parse the Don'ts section and create dynamic rules from the text. Even partial NLP matching would be better than zero enforcement.

11. **Fix heading-hierarchy** -- Report all skips, not just the first. Check for missing h1. Flag multiple h1 elements.

12. **Recalibrate scoring** -- Start at 70 with current rule count, or add a coverage confidence metric. Raise pass threshold to 75.

13. **Add gradient detection for Tailwind** -- Scan class attributes for `bg-gradient-to-*` with `from-*` and `to-*` class patterns.

14. **Add fake testimonial detection** -- Look for testimonial-like structures (blockquote + attribution, or card with quote + name) with stock-like name patterns.

### Priority 4: Low (polish)

15. **Fix alt-text rule** -- Flag `alt=""` on non-decorative images. Flag `data-alt` without `alt`. Flag filename-as-alt-text patterns.

16. **Add duplicate resource detection** -- Flag duplicate `<link>` tags loading the same resource.

17. **Add font loading performance check** -- Flag Google Fonts without `display=swap`, excessive font weights loaded.

18. **Add icon grid flexibility** -- Check any position, 2-6 icons, `<img>` tags too, not just SVG/i elements.

---

## Conclusion

The anti-slop validation system is a skeleton. It has the right architecture (modular rules, shared context, scoring) but the actual detection coverage is dangerously thin. The most common AI slop patterns -- generic content, layout laziness, color opacity abuse, centered-everything design, Tailwind class-based styling -- are completely invisible to the system.

The scoring system compounds the problem by starting at 100 and giving the impression of quality where none has been verified. A page with lorem ipsum, no responsive design, all centered text, gray-only colors, and generic "Get Started" buttons would score 100/100 if it uses a custom font and has `alt` attributes on images.

**Bottom line**: Do not market this as "anti-slop" or "quality validation" in its current state. It's an accessibility + font linter with aspirations. The 8 rules need to become 25+ before the system delivers on its promise.
