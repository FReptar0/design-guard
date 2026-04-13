# Content Authenticity Rules

When generating text content for any web page, screen, or component, follow these
rules. AI-generated content fails in two ways: hallucinating things that don't exist,
and using generic copy that could describe any product. Both are slop.

---

## BAN: Hallucinated Features and Commands

**PATTERN:** Listing CLI commands, API endpoints, features, integrations, or capabilities without verifying they actually exist in the codebase.
**WHY:** Stitch MCP hallucinated 11 commands and skills in dogfood-v3 that do not exist. Plausible-sounding fake features destroy credibility instantly when users try them.
**INSTEAD:**
- Before listing CLI commands, read `package.json` scripts or the commands directory to get the real list.
- Before listing skills, read `.claude/skills/` directory contents.
- Before citing stats (test count, rule count, etc.), verify against source files.
- If you are unsure whether a feature exists, do NOT include it. Fewer real features beat more fake ones.

---

## BAN: Invented Statistics and Social Proof

**PATTERN:** "Trusted by 10,000+ developers", "500+ companies use...", "99.9% uptime", star counts you haven't verified, download numbers you made up.
**WHY:** Readers spot fake social proof immediately. A new open-source tool claiming "thousands of users" is an obvious lie.
**INSTEAD:**
- Use only verifiable numbers: actual GitHub stars (check the repo), actual npm downloads (check npm), actual test count (run `npm test`).
- If the project is new, say so honestly: "Open source, MIT licensed" instead of fake adoption metrics.
- For testimonials: use NONE rather than invented quotes with fake names.

---

## BAN: Generic Product Copy

**PATTERN:** Copy that could describe any SaaS tool if you swapped the product name. "Product X helps you work smarter, not harder. Our powerful platform integrates seamlessly with your existing tools."
**WHY:** Tells the reader nothing about what this specific product does. Every AI landing page has this.
**INSTEAD:**
- Every sentence must contain at least one detail specific to THIS product.
- Name concrete features: "Lint your HTML against 18 anti-slop rules" not "Validate your designs with our powerful engine."
- Use the product's actual terminology: "DESIGN.md", "anti-slop", ".claude/rules/", "Stitch MCP" -- not generic abstractions.
- Describe actual workflows: "Run `dg lint` to score your page, then `dg generate` to rebuild it" not "Streamline your design workflow."

---

## BAN: Uniform CTA Language

**PATTERN:** Multiple buttons on the page all using generic text: "Get Started", "Learn More", "Sign Up", "Try Now".
**WHY:** Generic CTAs tell the user nothing about what clicking will do. AI generates them because they are safe defaults.
**INSTEAD:**
- Every CTA button must describe its specific action: "Install via npm", "View Source on GitHub", "Read the Docs", "See Example Output", "Run the Linter".
- Vary CTA text across the page. No two buttons should say the same thing.
- Match CTA text to what actually happens when clicked.

---

## BAN: Filler Sections with No Real Content

**PATTERN:** Sections that exist only to fill space: empty "Our Mission" blocks, "Meet the Team" with placeholder bios, "Blog" sections linking nowhere, FAQ with questions nobody asked.
**WHY:** AI pads pages with standard SaaS sections regardless of whether the project has content for them.
**INSTEAD:**
- Only include sections that have real content to populate.
- If the project has no blog, no team page, no FAQ -- omit those sections entirely.
- Fewer sections with real content beat more sections with filler.
- For open-source projects: README content, actual code examples, real CLI output are always available as genuine content.
