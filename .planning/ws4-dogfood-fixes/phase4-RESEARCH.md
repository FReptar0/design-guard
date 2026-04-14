# Phase 4: Generation Strategy — Research

**Date**: 2026-04-12
**Files read**: ROADMAP.md, dogfood-results.md, dg-generate/SKILL.md, known-state.json

---

## Fix 1: Sequential generation, not parallel

**Status**: NOT DONE
**Current state**: Step 9 mentions "prefix subsequent prompts" for multi-screen but does NOT
say "one at a time" or "wait for completion." The timeout recovery section says "NEVER send
parallel requests to Stitch" but only as a sub-bullet in error handling, not as a general rule.
**Bug**: dogfood-results.md line 30 — "Lanzo 3 requests Stitch en paralelo sabiendo que el
servicio estaba con timeouts"
**Fix needed**: Add explicit sequential generation instruction as a top-level step, before step 9.

## Fix 2: Sync-after-timeout recovery

**Status**: PARTIALLY DONE
**Current state**: Stitch Timeout Recovery section (lines 119-137) has a 7-step flow:
- Step 2: inform user
- Step 3: suggest /dg-sync
- Step 4: run sync if user agrees (calls list_screens)
- Step 5: offer Claude fallback only after sync
This covers the intent but requires user confirmation before checking. The ROADMAP says
"wait then call list_screens to check if it completed" — implying an automatic brief check
before asking the user.
**Fix needed**: Add automatic brief wait (~30s) + list_screens check before presenting options.
This makes recovery faster — the screen may already be done.

## Fix 3: Model deprecation awareness

**Status**: NOT DONE
**Current state**: SKILL.md step 4 says "Call mcp__stitch__generate_screen_from_text with the
prompt" but never mentions model selection or known-state.json. If Stitch defaults to a
deprecated model, generated screens could be lower quality or fail.
**known-state.json models**: GEMINI_3_1_PRO (quality), GEMINI_3_FLASH (fast), GEMINI_3_PRO
(DEPRECATED), GEMINI_2_5_FLASH (DEPRECATED).
**Fix needed**: Add model selection step that references known-state.json for current models.

---

## Summary

| Fix | Status | Action needed |
|-----|--------|---------------|
| Sequential generation | NOT DONE | Add top-level instruction |
| Sync-after-timeout | PARTIALLY DONE | Add auto-check before user prompt |
| Model deprecation | NOT DONE | Add model awareness step |

All 3 fixes are SKILL.md edits only. No TypeScript changes needed.
