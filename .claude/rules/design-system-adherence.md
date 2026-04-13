# Design System Adherence Rules

When generating any visual output (HTML, CSS, components), enforce DESIGN.md as the
single source of truth. These rules ensure generated output matches the project's
design system, not AI defaults.

---

## BEFORE GENERATING

1. **Read DESIGN.md FIRST.** Before writing any HTML or CSS, read the project's DESIGN.md file. If it does not exist, tell the user and offer to create one with `/dg-design` or `/dg-discover`.

2. **Extract tokens.** From DESIGN.md, note:
   - All color hex values and their roles (Section 2)
   - Font families, sizes, weights, line heights (Section 3)
   - Spacing base unit, scale, max-width, breakpoints (Section 4)
   - Component patterns: buttons, cards, code blocks (Section 5)
   - Icon library, size, stroke style (Section 6)

3. **Load Section 8 as hard constraints.** Every item in "Do's and Don'ts" is a non-negotiable rule for this project. Treat each "Don't" as a BAN with the same weight as the rules in `anti-slop-design.md`.

---

## COLOR COMPLIANCE

- Use ONLY hex values from DESIGN.md Section 2 palette.
- When you need a shade variant (lighter/darker), derive it from the palette hue. Do NOT introduce new hues.
- Map every color role to a CSS custom property or Tailwind config value.
- If the design calls for a color not in the palette, flag it to the user rather than inventing one.
- Never use named CSS colors (`red`, `blue`, `purple`) -- always use the specific hex from DESIGN.md.

---

## TYPOGRAPHY COMPLIANCE

- Use ONLY the font families listed in DESIGN.md Section 3.
- Match the exact sizes, weights, and line heights from the specification table.
- Load fonts via Google Fonts `<link>` with `display=swap`, or use the method DESIGN.md specifies.
- Apply heading font to all headings (h1-h6), body font to paragraphs and UI text, mono font to code and terminal output.
- Do not mix in fonts that are not in DESIGN.md, even as fallbacks beyond the generic family (sans-serif, monospace).

---

## SPACING COMPLIANCE

- Use the base unit and scale from DESIGN.md Section 4.
- Respect the max content width. Do not let content exceed it.
- Use the specified grid system (column count, gutter size).
- Apply the specified breakpoints for responsive behavior.
- Section padding should follow DESIGN.md values, varied per the anti-slop spacing rule.

---

## COMPONENT COMPLIANCE

- Follow the button styles from DESIGN.md Section 5 exactly: radius, padding, colors, hover states.
- Follow card/container styles: background, border, radius, padding, hover behavior.
- Follow code block styling: background, font, radius, padding, syntax colors.
- Use the icon library specified in Section 6 (name, default size, stroke weight).
- Follow imagery guidelines from Section 7 (no photography if DESIGN.md says so, correct aspect ratios).

---

## VERIFICATION AFTER GENERATING

After writing HTML/CSS, mentally verify:
- [ ] Every color hex in the output appears in DESIGN.md Section 2 (or is a derived shade)
- [ ] Font families match DESIGN.md Section 3 exactly
- [ ] Spacing values align with DESIGN.md Section 4 scale
- [ ] Component styles follow DESIGN.md Section 5 patterns
- [ ] No item from Section 8 "Don'ts" list is violated
- [ ] No item from Section 8 "Do's" list is missing (if applicable to this page)

If any check fails, fix the output before presenting it.
