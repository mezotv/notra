# Visual Motif Catalog

Reference for mapping a product's central verb to a signature visual element. Loaded by the skill during Phase 3.0 (Context-to-Motif) and during iteration when a scene needs a Custom visual.

## The principle

The motif is the *physical / mental object that embodies what the product does*, rendered in a way a viewer recognizes in under 2 seconds.

The test: "Could I swap this motif onto an unrelated product and it would still make sense?" If yes, the motif is too generic. Stripe's gradient makes no sense on a logistics company — that is why it is signature. A pulsing checkmark on a type-checker says nothing more than it would on a to-do app — that is why it is generic.

## Motif ↔ verb table

| Product verb | Signature motif | State-change axis | Example custom element |
|---|---|---|---|
| **Compose / generate audio** | Waveform bars | Smooth ↔ glitchy ↔ unified | `<AudioWaveform />` goes jagged-red in ProblemSetup, magenta-clean in resolution |
| **Sync / replicate / stream** | Packet nodes on directed edges | Disconnected ↔ connected | Labelled dots traveling between named nodes along curved paths |
| **Type-check / validate** | TypeScript squiggle + diagnostic chip | Error ↔ clean | Red underline that erases line-by-line, revealing a green check halo |
| **Generate / synthesize** | Seed → fan-out tree | One input ↔ many outputs | Single dot branching into tagged variants with spring-chained entry |
| **Compress / optimize** | Dense grid collapsing | Before ↔ after | A 100-cell grid losing cells until it snaps into a sleek target shape |
| **Transform / migrate** | Morphing shape | Shape A ↔ shape B | A square unfolding into the destination structure; lerped vertices |
| **Ingest / collect** | Funnel or inbox | Chaos ↔ order | Scattered items flying inward and aligning into a single column |
| **Search / retrieve** | Radar sweep or spotlight | Unknown ↔ found | Moving beam revealing one card at full opacity; rest dim to 0.25 |
| **Sign / secure / authenticate** | Padlock + verified badge | Open ↔ closed | A lock that visibly clicks shut with a pulse ring |
| **Deploy / ship** | Rocket trail or checkpoint line | Local ↔ global | Dots traveling across a world map, lighting up regions in sequence |
| **Query / filter** | Sieve or hourglass | Mixed ↔ sorted | Many shapes falling through a filter, only matching shapes pass |
| **Cache / memoize** | Clock + store icon | Cold ↔ warm | Stopwatch hand spinning, transitions to a filled store box glowing |
| **Route / match** | Switchboard or junction | Unrouted ↔ routed | Incoming lines snapping to named output lanes with highlight trails |
| **Format / lint / refactor** | Comb / alignment rail | Jagged ↔ aligned | Off-axis lines sliding into a perfect grid alignment |
| **Schedule / orchestrate** | Calendar strip + conductor | Scattered ↔ sequenced | Tasks on a timeline snapping onto a beat-driven rhythm |
| **Monitor / observe** | Oscilloscope line + alert pulse | Quiet ↔ spike | Baseline with a spike that fires an alert chip |
| **Render / draw** | Blueprint grid filling in | Empty ↔ rendered | Wireframe lines appearing first, colors filling after |
| **Train / fine-tune (ML)** | Loss curve + converging dots | Noisy ↔ converged | Scattered dots settling onto a downward curve |
| **Chat / respond** | Typing indicator + bubble stack | Empty ↔ full | Three dots animating, then a bubble sliding in with highlighted tokens |
| **Test / benchmark** | Race lane with time markers | Slow ↔ fast | Two lanes with markers at different frame-synced positions, finish line flag |

If a product's verb isn't on this list, use the following heuristic to derive one:

1. Finish the sentence: "This feature lets developers ___ something." The verb in the blank is your starting point.
2. Ask: "What is the physical / spatial metaphor for that verb?" (filter, route, pack, pour, forge, tune, etc.)
3. The motif is a stylized render of that metaphor — not a clip-art icon of the word.

## State-change axis rules

Every motif must change state between scenes. The three most common axes:

- **Problem ↔ Solution**: broken/glitchy/red in ProblemSetup → smooth/unified/primary in LibrarySwap + CTA
- **Empty ↔ Full**: cold / sparse in early scenes → dense / lit in resolution
- **Disconnected ↔ Connected**: scattered nodes in Problem → edges light up in Solution

Pick ONE axis per video and hold it. Mixing axes ("broken → full → fast") reads as confused.

## Color script (emotion arc across scenes)

Separate from brand palette. A color script maps scene-to-scene emotional shift using temperature / saturation:

- **Neutral warm** for the hook (inviting, confident)
- **Cool / desaturated / red-accented** for the problem (tension, dissatisfaction)
- **Back to warm + saturated brand primary** for the solution and CTA (relief, resolution)

Implementation: use `SceneBackground` variants as the color-script surface. `primary-glow` reads as warm+on-brand, `vignette` reads as cool/pressing, `diagonal` reads as transitional.

## Kinetic type restraint

Text animates only when motion carries information. Motion without a payload reads as generic.

- ✓ A word scales up when it's the answer the previous scene teed up
- ✓ Letters slide in one-by-one when the sequence itself is the message ("M · U · S · I · C")
- ✗ Every headline bouncing into place on every scene (dilutes emphasis)
- ✗ Continuous looping shimmer on every text layer (fatigues the viewer)

Counter-expectation wins. If the default move is fast-and-loud, still-and-soft lands harder (and vice versa).

## First-10-seconds value prop check

By the ~10-second mark, the viewer must know:
1. What the product is (or what this feature does)
2. Who it's for (implicit through evidence/audience cues)
3. Why they should care (the promise)

Scenes 1 and 2 typically carry this. If the skill plans a scene layout where the value prop isn't readable by the end of scene 2, it must restructure before scaffolding — not wait for the CTA to deliver it.

## Dev-tool aesthetic cues

When the audience is engineers, the "serious tool" visual signal is:
- Subtle blueprint grid or dot-matrix under content (low opacity, large scale)
- Monospace-influenced type on labels, numerics, and code
- Restrained palette (1 primary + 1 accent + grays), not illustrative gradients everywhere
- Systematic spacing (same scale every scene — see SKILL.md Layout Rule #5)

Avoid: cartoon illustrations, emoji-heavy layouts, soft watercolor backgrounds, excessive bezier bounce easings. Those signal consumer-facing, not developer-trusted.

## Generic motifs to avoid

The following are overused across AI-generated dev marketing and should NOT be the signature motif (they can appear incidentally but never carry the narrative):

- Pulsing generic checkmark
- Abstract geometric blobs
- "Sparkles" / magic-wand icons
- Rotating loading spinner
- Generic bar charts without data
- Stock keyboard/terminal imagery without a state change

If the story truly has no physical metaphor (e.g., a meta-platform with no single verb), fall back to **kinetic typography-as-motif** — treat the product name or a key term as the recurring element, morphing its treatment between scenes.
