# Hook Patterns

Research-backed patterns that reliably earn the first 3 seconds. The hook must match at least one.

## Result

Lead with the outcome. No setup, no context.

- "Validate any schema in one line"
- "Ship five videos a day"
- "Zero build config, native TypeScript"
- "Fifty-millisecond cold starts"

**When to use:** API/library features with a clear measurable or categorical outcome.

## Mistake

Call out something the audience is doing wrong.

- "You're writing validation three times"
- "Your tests run in the wrong order"
- "Stop using useState for forms"

**When to use:** DX improvements, refactoring wins, pattern changes.

## Secret

Imply inside knowledge.

- "Hidden in the v2 release"
- "The one config nobody enables"
- "What senior engineers know about hooks"

**When to use:** Under-the-radar features, config flags, advanced patterns.

## Comparison

Put competing options side by side.

- "Zod vs Valibot vs Arktype — same code"
- "Postgres or SQLite — pick both"
- "React vs Solid — identical syntax"

**When to use:** Interop features, integrations, cross-library compatibility.

## Pattern-interrupt

A confrontational or unexpected claim.

- "Your ORM is lying to you"
- "Stop shipping React on Monday"
- "Your linter is wrong about this"

**When to use:** Bold positioning, contrarian technical arguments.

## Curiosity-gap

A question or open loop the rest of the video closes.

- "One library, every validator — how?"
- "What if imports were free?"
- "Why is this 100x faster?"

**When to use:** Novel approaches, counter-intuitive improvements, unexpected results.

## Visual-hook

The hook is primarily a *surprising image, motion, or paradox* — the headline text plays a supporting role or is delayed by 0.5–1s while the visual lands first. Research on scroll-stopping short-form video is consistent: the single strongest attention-grab on silent-autoplay platforms is an unexpected *visual* in the first half-second, not a caption.

Mechanics:

- The HookTitle scene opens with the signature motif from Phase 3.0 in an **unexpected state** — a single bar of the waveform pulsing alone against near-silence, a squiggle underline drawing itself out, a padlock slowly turning. The text headline fades in 15–30 frames *after* the visual has established the mood.
- A pattern-breaking motion: a perfectly still frame that suddenly snaps — or the opposite, a continuously moving frame that freezes on a single word.
- A paradox frame: two elements that "shouldn't fit together" shown together (e.g., a TypeScript error rendered next to a green checkmark with no setup).

Examples:

- Audio feature hook: one magenta waveform bar pulsing alone at center → the rest of the wave springs into existence → headline fades in reading *"Your app can compose music now"*
- Type-safety feature hook: a red squiggle draws itself under a code line → snaps to a green check halo → headline *"Your API is wrong here — and here, and here"*
- Perf feature hook: a progress bar fills to 50% and stalls → suddenly snaps to 100% → headline *"Fifty-millisecond cold starts"*

**When to use:** Any hook that would otherwise lead with only text, especially when the signature motif is visually distinctive. Pairs well with Result or Curiosity-gap text content — the visual carries the surprise, the text delivers the specificity.

**Constraint:** a visual-hook still obeys Rule 1 (max 7 words on the caption), Rule 2 (no blocked openings), and Rule 5 (anti-clickbait — the hook's promise must be delivered later). The visual is a delivery mechanism, not an exception.

## Anti-examples (never generate these)

- "In this video I'll show you..." (dead opener)
- "Introducing Standard Schema" (product-name opener)
- "Let's talk about validation" (zero promise)
- "Want to learn about schemas?" (weak curiosity-gap — no specific payoff implied)
- "The amazing new feature you have to see!" (clickbait with no specific promise)
