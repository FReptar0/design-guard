# Design Evaluation Rubric

## Anti-Inflation Anchor

Most AI output genuinely scores 2-3. A 4 means a designer would need to look twice. A 5 means indistinguishable from human work. If you are giving 4s frequently, you are grade-inflating.

Before scoring, re-read this anchor. After scoring, check yourself against it.

---

## Axes

### Design Fidelity (20%)

Does the output match DESIGN.md specs?

   - 1: Ignores DESIGN.md entirely (wrong fonts, wrong colors, wrong spacing)
   - 2: Uses some DESIGN.md values but mixes in AI defaults (Inter appears, purple-blue gradients sneak in)
   - 3: Colors and fonts match DESIGN.md but spacing/layout feel mechanical
   - 4: All DESIGN.md values applied correctly with intentional variation
   - 5: DESIGN.md brought to life -- the spec feels like it was written AFTER seeing this page

### Visual Distinction (20%)

Would someone immediately know AI made this?

   - 1: Carbon copy of every AI landing page (hero + 3-col icons + testimonials + CTA)
   - 2: Recognizable AI template with minor customization (colors changed, copy swapped)
   - 3: Some original layout choices but still has 2+ AI tells (uniform spacing, symmetric grids)
   - 4: Would require inspection to suspect AI; layout has genuine surprises
   - 5: Could appear in a designer's portfolio; no AI tells visible

### Content Authenticity (15%)

Is copy real, specific, non-generic?

   - 1: Lorem ipsum or "Transform your X with our Y" throughout
   - 2: Mostly generic SaaS copy with a few product-specific terms inserted
   - 3: Product-specific copy but relies on buzzwords ("seamless", "revolutionary")
   - 4: Reads like a human copywriter wrote it; specific claims and real details
   - 5: Distinctive voice that matches brand personality; memorable phrasing

### Layout Intentionality (15%)

Does layout serve content, or is it a template?

   - 1: Pure template: hero > 3-col features > testimonials > CTA, no thought to content needs
   - 2: Template with one non-standard section (but the rest follows the formula)
   - 3: Layout mostly serves content but has mechanical regularity (all sections same height/structure)
   - 4: Layout adapts to content -- dense info gets more space, CTAs breathe, sections flow naturally
   - 5: Layout DRIVES the narrative; you could not rearrange sections without losing impact

### Component Craft (15%)

Are components designed or default?

   - 1: Browser defaults or minimal styling; components feel like a prototype
   - 2: Styled but uniform -- every button, card, and input looks the same (same radius, same shadow, same spacing)
   - 3: Components have distinct styles but lack polish (hover states present but generic)
   - 4: Refined interaction states, intentional variation between component types
   - 5: Components have personality; micro-interactions, thoughtful transitions, purposeful asymmetry

### Coherence (15%)

Does the page work as a unified whole?

   - 1: Sections feel copy-pasted from different sites; no visual thread
   - 2: Color palette is consistent but rhythm, density, and tone shift randomly
   - 3: Visually consistent but metronomic (same padding, same structure, same rhythm throughout)
   - 4: Consistent with intentional variation; the page breathes and flows
   - 5: Every element supports every other; removing one section would leave a visible gap

---

## Evidence Format

Use this format for each axis in the detailed findings:

```
### [Axis Name]: [Score]/5

**Evidence (negative):**
- `<selector or line ref>`: [specific observation]

**Evidence (positive):**
- `<selector or line ref>`: [specific observation]

**Reasoning:** [1-2 sentences explaining score]
**Fix suggestion:** [1 actionable improvement, tagged P0-P3]
```

Evidence must cite specific CSS selectors, HTML tag names, or line-approximate references. No vague claims like "the layout feels template-like" without pointing to the specific element that proves it.

---

## Score Normalization

Raw score = sum of six axis scores (range 6-30).

```
NormalizedScore = ((rawScore - 6) / 24) * 100
```

Round to the nearest integer.

---

## Result Bands

| Range  | Label       | Meaning                                              |
|--------|-------------|------------------------------------------------------|
| 0-24   | FAILING     | Obvious AI output, start over                        |
| 25-49  | NEEDS WORK  | Has potential but AI tells dominate                   |
| 50-74  | ACCEPTABLE  | Passes basic quality bar, iterate on weak axes        |
| 75-89  | GOOD        | Genuine design quality, minor refinements only        |
| 90-100 | EXCEPTIONAL | Portfolio-grade, ship it                              |
