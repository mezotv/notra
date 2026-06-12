# Pattern: bug-fix

## When to Use

- "fix" in PR title
- `bug` label applied
- Linked issue is bug report

## Scene Sequence (30s target)

1. **HookTitle** (0-3s) — Mistake or Pattern-interrupt pattern
2. **BeforeAfter** (3-18s) — broken state (code or UI) vs fixed state
3. **CTAEndScreen** (18-30s) — "Update to vX.Y.Z"

## Code Handling

**Synthesize before/after snippets.** Raw diffs from bug fixes are usually noisy (tests, edge cases, typo fixes). Synthesize a clear minimal example that shows the broken behavior on the left and the fixed behavior on the right.

If the bug is visual (UI), use screenshots instead of code in BeforeAfter.

## Hook Pattern Bias

Strong fit:
- Mistake (`"Your forms were losing focus"`)
- Pattern-interrupt (`"Your submit button was lying"`)

Avoid: Result (often feels passive-aggressive — "Finally, submit buttons work!"). Comparison and Secret usually don't fit bug fixes.

## Example

PR: fixes a form focus bug that caused the submit button to become unclickable after validation error.

- HookTitle: `"Your submit button was lying"` (Pattern-interrupt, 5 words)
- BeforeAfter: left = "click submit → nothing"; right = "click submit → works"
- CTAEndScreen: "Update to 2.1.4"
