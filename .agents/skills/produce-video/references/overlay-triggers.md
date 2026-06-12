# Overlay-trigger detection (P4 — the editing brain)

From the **final** word-timestamped transcript (`transcript.words.json`), scan for triggers and emit one overlay plan row per opportunity. Each row:

```
{ start, est_duration, type, content, safe_zone, why }
```

For `onscreen_highlight` rows, also carry the frame-analysis fields from `frame-analysis.md`: `box {x%,y%,w%,h%}`, `t_start`, `t_end`, and `stability_checked` (`stable` | `shortened` | `fallback_card`). A row whose `stability_checked` is `fallback_card` is rebuilt as a `code_snippet` instead.

`start` = the spoken word's timestamp. `est_duration` must satisfy the dwell minimums below. Place rows in an editable table for the **approval gate** before any build.

## Trigger → overlay type

| Trigger in transcript | Type | Template | Anchor |
|---|---|---|---|
| Talks about code **already visible on screen** (screen-share phase) | `onscreen_highlight` | `OnScreenHighlight.html` | word start; box from frame analysis (see `frame-analysis.md`) |
| Mentions a function/API/file with **no code on screen** (talking-head phase), "here's the code…" | `code_snippet` | `CodeSnippet.html` | word start |
| Stresses a key term, "the important part is…", "the key thing…" | `word_highlight` | `WordHighlight.html` | exact word ts |
| Enumerates ("first… second…", "three things", "a couple reasons") | `list_steps` | `ListSteps.html` | each item's ts |
| Contrasts ("before vs after", "X instead of Y", "the old way / the new way") | `comparison` | `Comparison.html` | span start |
| Describes a flow/architecture ("request goes to… then…") | `diagram` | `Diagram.html` | span start |
| New topic / section boundary | `section_label` | `SectionLabel.html` | sentence start |
| "as you can see here / this screenshot" + an image/file is available | `image_embed` | `ImageEmbed.html` | word start |
| Emphasis beat ("this is the key part", vocal stress, or to lead the eye to an on-screen highlight) | `zoom` | `PunchInZoom.html` | emphasis word ts |

## Code sourcing (for `code_snippet`)
Repo-if-available-else-synthesize: if the user provided a repo and a real definition matches, pull the real code; otherwise synthesize a realistic example and **flag it in the approval table as synthesized** (never present synthesized code as verified).

**Always use the terminal/window card** (`CodeSnippet.html` — traffic-light dots + a filename title bar + the dark high-contrast panel). This is the standard code look; do not invent a different code container.

**Format the code properly — like real, hand-written source, not a crammed one-liner:**
- One statement per line; correct, language-appropriate **indentation** (2 or 4 spaces consistently); blank lines between logical groups.
- Each line is its own `<span data-line="N">…</span>` (the card animates and highlights per line).
- Apply syntax colors via spans: keywords `.ov-cs-kw`, strings `.ov-cs-str`, comments `.ov-cs-com` (these read on the dark panel).
- Keep lines short enough to fit the card width (~≤ ~46 chars at the card's font size); wrap or refactor long lines, never let code overflow the card.
- Use real, idiomatic syntax for the language (correct imports, real API names, valid punctuation). A short, well-formatted excerpt beats a long dump — show only the lines that matter and `// …` elide the rest.
- The `{{HIGHLIGHT_LINE}}` should point at the single most important line.

Example — BAD (crammed, no indentation, runs off the card):
```
export async function loader({params}){const product=await db.product.find(params.id);if(!product)throw new Response("Not found",{status:404});return product;}
```
GOOD (one statement per line, indented, short lines, elided where it doesn't matter):
```
export async function loader({ params }) {
  const product = await getProduct(params.id);
  if (!product) throw notFound();
  return product;
}
```
Match the indentation/spacing of real source in that language (e.g. 2-space JS/TS, 4-space Python); never ship minified or single-line code in a card.

## Editorial restraint (honor the density setting: sparse / balanced / rich)
Run a silent self-improvement pass before presenting the plan:
- Cull clutter to match density; merge overlays whose payoff is the same.
- **Minimum gap** between consecutive overlays so the frame isn't constantly busy (≈≥1.5s of clear air between distinct overlays unless intentionally stacked).
- Every overlay must clear its **dwell minimum** before the next change:

| Element | Min dwell (after entrance completes) |
|---|---|
| Short word/phrase highlight (≤6 words) | ≥ 1.5s |
| Section label / single line | ≥ 2.0s |
| List (per item) | ≥ 1.2s/item |
| Code snippet / on-screen highlight | ≥ 3.0s |
| Comparison / diagram | ≥ 3.5s |

- Validate every overlay's placement against the **active framing phase's safe zone** (`framing-safe-zones.md`). An overlay that would cover the face/webcam is repositioned or dropped.
- Iterate ≥2 passes until stable, then present for approval.
