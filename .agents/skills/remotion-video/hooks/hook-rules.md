# Hook Enforcement Rules

These rules apply to the `text` field of any `HookTitle` scene in `story.ts`. They exist to prevent scroll-past: research shows 65% of viewers who watch the first 3 seconds stay for 10+ seconds, and the hook is the only thing that earns that first 3 seconds.

## Rule 1: Max 7 words

Count whitespace-separated tokens. Reject hooks with more than 7.

Examples:
- ✓ `"Swap validation libs with one line"` (6 words)
- ✗ `"Introducing our new standard schema interface for validation libraries"` (9 words)

## Rule 2: Blocked openings

Reject hooks whose first phrase matches (case-insensitive):

- `"In this video"`
- `"I'm excited to"`
- `"I am excited to"`
- `"Today we're launching"`
- `"Today we are launching"`
- `"Announcing"`
- `"Introducing"`
- Hook's first word is the product/company name

Rationale: every one of these is a scroll-past signal. The viewer learns nothing in the first second.

## Rule 3: Must match one of seven patterns

See `hook-patterns.md`. The hook must map to at least one:

- Result
- Mistake
- Secret
- Comparison
- Pattern-interrupt
- Curiosity-gap
- Visual-hook (visual leads, text lands 15–30 frames later; text still obeys all other rules)

If the generated hook doesn't fit any, regenerate.

## Rule 4: Visual reinforces text

The `HookTitle` scene's `visual` prop (`pattern-interrupt`, `curiosity-gap`, `social-proof`) must align with the hook text. If the text is a curiosity-gap question, the visual should be a question-mark or mystery pattern, not a celebration pattern.

Validated at Phase 3.3 (scene plan approval) before scaffold.

## Rule 5: Anti-clickbait check

Before render, verify the hook's promise is delivered by at least one non-hook scene. Example:

- Hook: `"Swap validation libs with one line"` → at least one later scene must actually show a library being swapped with one line of code.
- Hook: `"You're writing validation three times"` → at least one later scene must show three duplicate validation code blocks being reduced to one.

If no delivery scene exists, refuse to render and ask the user to:
1. Rewrite the hook, OR
2. Add a delivery scene

## Enforcement Flow

1. Phase 3.3 (scene plan approval): run rules 1, 2, 3, 4 on the proposed hook text.
2. Phase 5 (iteration): re-run rules 1, 2, 3 after every user edit that changes hook text.
3. Phase 6.1 (pre-render): run all 5 rules including rule 5. Block render if any fail.

If a rule fails, the skill proposes up to 3 alternatives that comply and asks the user to pick or edit.
