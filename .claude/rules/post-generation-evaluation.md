# Post-Generation Evaluation Rules

After generating ANY HTML page, screen, or component, run this self-evaluation
BEFORE presenting the output to the user. This is the bridge between generation
and validation -- catch what you can fix before the user ever sees it.

---

## MANDATORY SELF-CHECK

After writing HTML/CSS output, pause and run through this checklist mentally.
If any item fails, fix the output before presenting it.

### 1. The AI-Tell Test
Look at the page structure. Would a designer immediately know AI made this?

Check for these dead giveaways:
- [ ] Three identical cards in a row (the AI homepage layout)
- [ ] Icon-tile-above-heading on every feature card
- [ ] Side-tab accent border (thick colored left border on cards)
- [ ] Gradient text on the hero heading
- [ ] Colored glow shadows on multiple elements
- [ ] Every card has identical glassmorphism treatment
- [ ] All sections have identical vertical padding
- [ ] Every button looks the same (no primary/secondary/ghost hierarchy)

If 2+ items are checked, the page has slop. Fix before presenting.

### 2. The DESIGN.md Compliance Test
Pull up the project's DESIGN.md and verify:

- [ ] Colors: every hex in the output exists in Section 2 palette
- [ ] Fonts: font-family declarations match Section 3 exactly
- [ ] Spacing: values align with Section 4 scale
- [ ] Components: buttons, cards, code blocks follow Section 5
- [ ] Section 8: no "Don't" item is violated

If any check fails, fix the specific violation.

### 3. The Content Truth Test
Verify every factual claim in the generated content:

- [ ] CLI commands listed actually exist (check against source)
- [ ] Feature descriptions match real capabilities
- [ ] Stats and numbers are accurate (test count, rule count, etc.)
- [ ] No testimonials with invented names/companies
- [ ] CTAs describe their actual destination/action

If any claim is unverified, either verify it or remove it.

### 4. The Specificity Test
Read the page copy aloud. For each sentence, ask: "Could this describe a different product?"

- [ ] Hero text names specific features, not vague promises
- [ ] Feature descriptions use the product's actual terminology
- [ ] At least 3 sentences contain product-specific details (command names, file names, technical terms)

If the copy is interchangeable with any other product, rewrite with specifics.

### 5. The Variation Test
Check for robotic repetition across the page:

- [ ] Cards/features have varied visual treatment (not all identical)
- [ ] Section spacing has at least 3 distinct values
- [ ] Headings vary in style (not all the same size and weight)
- [ ] Content structure varies (not icon+heading+paragraph repeated 6 times)

If everything looks uniform, introduce intentional variation.

---

## WHEN TO SKIP

You may skip this evaluation only when:
- Generating a code snippet (not a full page/component)
- Making a single-line text edit to existing HTML
- The user explicitly says "skip evaluation" or "just give me the raw output"

For any full page, section, or multi-element component: always run the checklist.

---

## REPORTING

After running the evaluation, briefly note what you checked:
- "Self-check: passed all 5 tests" (if clean)
- "Self-check: fixed [specific issue] before presenting" (if you caught something)

Do NOT present a lengthy evaluation report. One line is enough.
The user cares about the output, not the process.
