# Phase 4, Plan 01: Generation Strategy Fixes

**Phase**: 4 — Generation Strategy (P2)
**Research**: phase4-RESEARCH.md
**File**: `.claude/skills/dg-generate/SKILL.md`

---

## Changes

### Change 1: Sequential generation instruction
**Location**: After step 9 (multi-screen prefix), add a new step about sequential generation
**What**: Explicit instruction that multi-screen requests MUST be generated one at a time.
Wait for each screen's full cycle (generate -> critic -> fix) before starting the next.
NEVER send parallel requests.

### Change 2: Auto-check on timeout before user prompt
**Location**: Stitch Timeout Recovery section, between step 1 and current step 2
**What**: After a timeout occurs, automatically wait ~30 seconds then call
`mcp__stitch__list_screens` to check if the screen completed server-side. If found,
download it silently and skip straight to critic. If not found, THEN inform the user
and offer options. This saves a round-trip of asking the user before checking.

### Change 3: Model awareness step
**Location**: Step 4 (Generate the screen), in the Stitch sub-section
**What**: Before calling generate_screen_from_text, read known-state.json to check
current (non-deprecated) models. Use GEMINI_3_FLASH for fast iteration, GEMINI_3_1_PRO
for high-quality screens. Default to GEMINI_3_FLASH unless the user requests high quality.

---

## must_haves

- [ ] SKILL.md contains explicit "one screen at a time" instruction for multi-screen requests
- [ ] SKILL.md timeout recovery includes automatic list_screens check before user prompt
- [ ] SKILL.md references known-state.json for model selection
- [ ] Current model names (GEMINI_3_FLASH, GEMINI_3_1_PRO) appear in SKILL.md
- [ ] Deprecated models (GEMINI_3_PRO) are mentioned as "do not use"
- [ ] All tests still pass after changes

## Verification

```bash
# Content checks
grep -c "one.*at a time\|ONE AT A TIME\|one screen at a time" .claude/skills/dg-generate/SKILL.md
grep -c "known-state.json" .claude/skills/dg-generate/SKILL.md
grep -c "GEMINI_3_FLASH" .claude/skills/dg-generate/SKILL.md
grep -c "GEMINI_3_1_PRO" .claude/skills/dg-generate/SKILL.md
grep -c "list_screens" .claude/skills/dg-generate/SKILL.md

# Regression check
npm test -- --run
```
