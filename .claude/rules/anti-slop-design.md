# Anti-Slop Design Rules

When generating HTML/CSS for any web page, screen, or component, follow these rules.
Each rule bans a specific AI-tell pattern. Every ban includes WHY it signals AI
and WHAT to do instead. These are non-negotiable during generation.

---

## TYPOGRAPHY

### BAN: Icon-Tile-Above-Heading Cards
**PATTERN:** `<div class="icon-wrapper"><svg .../></div><h3>Title</h3><p>Desc</p>` repeated in a grid
**WHY:** The universal AI feature-card template. Rounded-square icon sitting above a heading is the single most common AI layout fingerprint.
**INSTEAD:** Use icons inline with headings (`<h3><svg .../> Title</h3>`), place icons in the margin, vary icon treatments per card, or omit icons entirely on some cards.

### BAN: Single Font for Everything
**PATTERN:** Only one `font-family` declaration across the entire page.
**WHY:** No typographic hierarchy. Every AI page uses one font for headings, body, and captions.
**INSTEAD:** Pair a display/serif heading font with a humanist sans body font. Minimum 2 font families. Use a monospace third font for code/technical terms.

### BAN: Flat Type Hierarchy
**PATTERN:** Font sizes within a 1.25x ratio between consecutive steps (e.g., 16px body, 18px h3, 20px h2).
**WHY:** Sizes too close together destroy visual distinction. AI plays it safe with tiny increments.
**INSTEAD:** Use a clear modular scale (1.333x or 1.5x ratio). H1 should be at least 2.5x body size. Make the size difference between heading levels obvious at a glance.

### BAN: All-Caps on Body Text
**PATTERN:** `text-transform: uppercase` on paragraphs or text blocks longer than 5 words.
**WHY:** Destroys word-shape recognition and readability. AI applies uppercase for false emphasis.
**INSTEAD:** Reserve uppercase for short labels, nav items, or eyebrow text (under 5 words). Use font weight and size for emphasis, not case.

---

## COLOR

### BAN: Gradient Text on Headings
**PATTERN:** `background: linear-gradient(...); -webkit-background-clip: text; color: transparent`
**WHY:** Decorative gradient text is a top-3 AI fingerprint. Applied to every hero heading by default.
**INSTEAD:** Use a solid color from the palette for headings. If you must use gradient text, limit to ONE element on the entire page (not the main heading).

### BAN: Dark-Glow Box Shadows on Everything
**PATTERN:** `box-shadow: 0 0 Npx rgba(R,G,B,0.3+)` with a colored (non-black) glow on dark backgrounds, applied to 3+ elements.
**WHY:** "The default look of AI-generated UIs" (Impeccable). Colored glow on every card and button is an instant AI tell.
**INSTEAD:** Use subtle elevation shadows (`0 2px 8px rgba(0,0,0,0.3)`) or border-based hierarchy. Reserve colored glow for exactly ONE primary CTA button. All other elements use neutral shadows or borders.

### BAN: Pure Black Backgrounds
**PATTERN:** `background: #000000` or `background: #000` or `background: black` or `bg-black`
**WHY:** Harsh, unnatural contrast. Real dark themes use tinted blacks.
**INSTEAD:** Tint toward brand hue: `#0F0F1A` (navy-tinted), `#1A1A2E` (purple-tinted), `#0D1117` (GitHub-style). Check DESIGN.md Surface color.

### BAN: Opacity-as-Palette
**PATTERN:** 5+ different `rgba(0,0,0,N)` or `rgba(255,255,255,N)` alpha values used as the color system.
**WHY:** Lazy substitute for intentional color choices. Creates a muddy, undesigned feel where nothing has a deliberate color.
**INSTEAD:** Define explicit surface/shade variants: `--surface-1`, `--surface-2`, `--surface-3`. Derive them from the DESIGN.md palette, not from opacity stacking.

---

## LAYOUT

### BAN: Metronomic Section Spacing
**PATTERN:** Same padding/margin value (e.g., `py-20`, `mb-32`, `padding: 80px 0`) on every section with no variation.
**WHY:** Creates robotic rhythm. Real designs use intentional spacing variation to signal section importance and create visual breathing room.
**INSTEAD:** Vary section spacing deliberately: larger spacing (96-128px) before hero and CTA sections, medium (64-80px) for standard sections, tighter (32-48px) between related subsections. At least 3 distinct spacing values across sections.

### BAN: Nested Cards
**PATTERN:** A card element (bordered/shadowed container) inside another card element.
**WHY:** Visual noise and excessive depth. Creates confusion about content hierarchy and containment.
**INSTEAD:** Use single-level containment only. Separate nested content with spacing, background tint, or typography changes -- not additional borders or shadows.

### BAN: Three Identical Cards in a Row
**PATTERN:** `grid-cols-3` or `flex` with 3 children that have identical structure (same classes, same element count, same icon+heading+paragraph pattern).
**WHY:** "The default AI homepage layout." Section 2 or 3 of every AI page is three identical cards.
**INSTEAD:** Use a bento grid with mixed card sizes (one wide + two narrow, or 60/40 split). Vary the internal structure per card: one card with an image, one with a stat, one with a quote. If 3 items are needed, differentiate visually.

---

## COMPONENTS

### BAN: Side-Tab Accent Borders
**PATTERN:** `border-left: 3-5px solid [color]` or `border-l-4` on cards or content blocks.
**WHY:** "The most recognizable tell of AI-generated UIs" (Impeccable). Thick colored left border on a card is an immediate AI signal.
**INSTEAD:** Differentiate cards via: background tint variation, top border (thinner, 2px max), icon accent color, size variation, or hover state changes. No thick side borders.

### BAN: Uniform Glassmorphism on All Cards
**PATTERN:** Same `backdrop-filter: blur(Npx); background: rgba(255,255,255,0.0N)` applied to every card (5+ elements with identical glass treatment).
**WHY:** "Find one effect, apply uniformly everywhere." Dogfood-v3 had 17 identical glass cards. Uniform application kills the premium feel glassmorphism is meant to create.
**INSTEAD:** Use glassmorphism on 2-3 featured/hero elements only. Use solid backgrounds for standard cards, subtle borders for others. Vary treatments: glass for featured, solid for standard, outlined for tertiary.

### BAN: Every Button Is Primary
**PATTERN:** All buttons on the page have the same filled/colored style. No secondary or ghost variants exist.
**WHY:** No visual hierarchy in actions. User cannot distinguish the main CTA from secondary actions.
**INSTEAD:** Use button hierarchy: 1 primary (filled with brand color), 1-2 secondary (outlined or muted), remainder ghost (text-only or underlined). The primary CTA should be visually dominant.

### BAN: Border Accent on Rounded Elements
**PATTERN:** `border: 2-3px solid [accent-color]; border-radius: 10px+` -- thick accent-colored border combined with large border-radius.
**WHY:** Creates awkward visual tension. The thick colorful border fights with the soft rounded shape.
**INSTEAD:** Choose one: sharp/square corners with accent borders, OR rounded corners with shadows/background fills. For rounded cards, use `border: 1px solid [muted-color]` at most.
