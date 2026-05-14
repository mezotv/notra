# Pre-baked text glyphs (`derivedTextData`) — implementation plan

## Context: where this code lives

**`packages/kiwi`** is the workspace package that owns the entire HTML → Figma-clipboard pipeline:
- `src/dom-to-scene.ts` walks a DOM element, extracts layout/text/SVG geometry, and feeds it to the scene builder.
- `src/scene-builder.ts` (`SceneBuilder` class) holds the flat `nodeChanges[]` plus `blobs[]` and emits the final `Message` payload.
- `src/kiwi.ts` is the Kiwi binary schema codec (varint, structs, messages).
- `src/packer.ts` wraps an encoded message into the `fig-kiwij` HTML envelope (base64-in-data-attributes) that Figma reads on paste.
- `src/vector-network.ts`, `src/svg-path.ts` — the SVG → VECTOR work from earlier in this branch.
- `src/index.ts` exports `buildFigmaPasteHtml(element)` — the single public entrypoint.

The package is consumed by-source (no build step) via the workspace export map (`./src/index.ts`). Edits are live in the dashboard dev server.

**`apps/dashboard/src/app/test/page.tsx`** is the harness — a `/test` route in the dashboard that:
1. Fetches `apps/dashboard/public/index-copy.html` (the 1200×630 c15t OG-image test fixture).
2. Renders its `<body>` into a ref'd div.
3. On click, calls `buildFigmaPasteHtml(designRef.current)` and writes the result to the clipboard as `text/html`.
4. User pastes (Cmd+V) into Figma to verify.

This is the only consumer that exercises the pipeline end-to-end. Local non-Playwright diagnostics live under `/tmp/` (built by `/tmp/build-iife.ts`, run with `/tmp/run-ts-pipeline.ts`, decoded with `/tmp/decode-*.ts`).

The fixture stresses the parts of the pipeline that matter:
- inline-styled spans (no external CSS the dashboard's `dangerouslySetInnerHTML` would drop),
- multiple `<svg>`s with `<path>` data (one with `fill-rule="evenodd"`),
- text in several Geist weights, including wrapped paragraphs.

## Why

When we paste a scene into Figma, text nodes either render or don't, depending on whether Figma's font resolver finds the requested family + style. In our test environment:

- `Geist / Semi Bold` resolves → renders.
- `Geist / Bold`, `Geist / Regular`, `Geist / Medium` → no warning, no glyphs.
- `Inter / *` → also nothing.

This is reproducible across multiple Figma files, so it's not file-state. We can't fix Figma's font resolution from outside the app, so we bypass it by shipping pre-rendered glyph outlines alongside the text. That's what Figma does for its own copy/paste (`competitor.scene.json` is the existing reference for the format), and what `competitor.figma-paste.html` relies on to render "Secured by" in `Nimbus Sans` on machines without that font installed.

Behaviour we get for free once derivedTextData is in place:
- Glyphs render exactly as designed regardless of installed fonts.
- Editing the text in Figma prompts the user to substitute a font, then re-flows using the substitute. (Figma keeps the original glyph paths around until the user types.)

## What Figma expects on a TEXT node

```ts
{
  type: "TEXT",
  // ... existing fields ...
  textData: { characters, lines },
  fontName: { family, style, postscript: "" },
  fontSize, letterSpacing, lineHeight,
  derivedTextData: {
    layoutSize: { x: number, y: number },
    baselines: Array<{
      position: { x: number, y: number },  // line origin (baseline)
      width: number,                        // line content width
      lineY: number,                        // top of line box
      lineHeight: number,
      lineAscent: number,                   // ascender height above baseline
      firstCharacter: number,               // index in `characters`
      endCharacter: number,
    }>,
    glyphs: Array<{
      commandsBlob: number,                 // index into Message.blobs[]
      position: { x: number, y: number },   // glyph origin on baseline
      fontSize: number,
      firstCharacter: number,
      advance: number,                      // multiplier on fontSize (e.g. 0.664)
      rotation: number,
    }>,
  },
}
```

Plus the `Message.blobs` array gains one entry per unique (font, glyph) pair (deduplicated). Each blob is the binary format documented below.

## `commandsBlob` binary format (decoded from `competitor.scene.json`)

```
[u8] header (always 0)
loop:
  [u8] command
    1 → MoveTo:    [f32 x] [f32 y]
    2 → LineTo:    [f32 x] [f32 y]
    3 → QuadTo:    [f32 x1] [f32 y1] [f32 x] [f32 y]
    4 → CubicTo:   [f32 x1] [f32 y1] [f32 x2] [f32 y2] [f32 x] [f32 y]
    5 → Close
    0 → End-of-blob (terminates the loop)
```

Coordinates are in **font em units normalized to a 1.0 em** — multiply by `fontSize` at render time to get the per-glyph drawing space. Glyph origin is at `position` on the baseline; positive Y goes **down** in the blob's local space (a glyph's ink extends from roughly `0` at the baseline up to `-ascent` and down to `+descent`).

Encoder is straightforward — one Uint8Array, append cmd byte + LE floats per command, terminate with a `0`.

## Source of glyph data

Geist is loaded by the dashboard via `next/font/google`, which serves WOFF2 from `/_next/static/media/<hash>.woff2`. Two ways to get glyph outlines:

**A. Bundle Geist OTF files into `packages/kiwi`.**
- Pros: deterministic, no runtime fetch, version-pinned.
- Cons: ~300–600KB of font binaries in the package.
- Source: `@vercel/geist` npm package or the public Geist GitHub release.

**B. Discover the font URL at runtime from `document.fonts` / stylesheet rules.**
- Pros: no bundled assets, works for any font the host page loads.
- Cons: more fragile (WOFF2 decompression in the browser needs an extra dep like `wawoff2` or `fflate` + woff2 wrapper handling); harder to test in Playwright; behaviour depends on the host page.

**Recommended starting point**: B for flexibility, falling back to a hard-coded Inter OTF (bundled) when the requested font can't be discovered or fetched. Inter is universal enough that this fallback is a reasonable lower bound.

Parser: `opentype.js` v2. Handles OTF/TTF/WOFF natively. WOFF2 needs a separate decompressor (`wawoff2` ~150KB or `fflate`-based custom path). If we go path A with OTF, no WOFF2 dep is needed.

`opentype.js` returns each glyph as `{ path: { commands: [{type, x, y, x1, y1, x2, y2}, ...] }}` plus `advanceWidth` and `unitsPerEm`. Mapping `opentype.js` commands → our enum:

| opentype | our cmd | args                         |
| -------- | ------- | ---------------------------- |
| `M`      | 1       | `x, y`                       |
| `L`      | 2       | `x, y`                       |
| `Q`      | 3       | `x1, y1, x, y`               |
| `C`      | 4       | `x1, y1, x2, y2, x, y`       |
| `Z`      | 5       | —                            |

Coordinates need to be divided by `unitsPerEm` so the blob is normalized.

## Text layout

For each text node we currently emit, replace `addText({...})` with a richer flow:

1. Resolve the **font face** (opentype.js Font) for `family + style`. Cache by `${family}|${style}`.
2. For each character in `characters`:
   - Get the glyph from the font.
   - If we haven't seen that glyph yet, encode its commands into a Uint8Array, push to `Message.blobs`, remember the blob index in a `Map<glyphIndex, blobIndex>`.
   - Compute `advance = glyph.advanceWidth / unitsPerEm` (font-em units).
3. Walk the characters, accumulating an X cursor; if the cursor + next glyph's advance × fontSize exceeds the text node's width and we're in wrap mode, start a new line.
4. For each laid-out glyph, push to `glyphs`:
   ```
   { commandsBlob, position: {x: cursor, y: baselineY}, fontSize, firstCharacter, advance, rotation: 0 }
   ```
5. After laying out all glyphs, build the `baselines` array — one entry per line, each with `position`, `width`, `lineY`, `lineHeight`, `lineAscent`, `firstCharacter`, `endCharacter`.
6. `layoutSize.x` = max line width; `layoutSize.y` = sum of line heights.

Kerning, ligatures, BiDi, and shaping are **out of scope** for v1 — we use raw advance widths only. Most Latin text in static OG-image-style layouts is fine without these. Add later if needed.

## Letter-spacing

Our text nodes already carry `letterSpacing` from CSS (in pixels). For derivedTextData, glyph positions need this added to each cursor advance: `cursor += (advance * fontSize) + letterSpacing`. Figma will then re-apply letterSpacing when it re-flows — letterSpacing must be on the text node so the two stay consistent.

## Wrap handling

We already detect wrapped text via `range.getClientRects().length > 1`. For wrapped text:
- Use the parent element's content width as the text node width.
- During layout, break lines greedily on whitespace when the cursor exceeds the width.
- Emit one `baselines` entry per line.

For unwrapped text, single baseline; line wrap logic short-circuits.

## File-level plan

```
packages/kiwi/
  src/
    text-glyph.ts        — NEW. Encodes a single opentype glyph path → commandsBlob bytes.
    text-layout.ts       — NEW. Lays out characters → glyphs + baselines + layoutSize.
                            Owns the glyph cache (Map<glyphKey, blobIndex>).
    fonts/
      inter.ts           — NEW. Bundled Inter OTF as base64/Uint8Array for fallback.
      loader.ts          — NEW. Discovers + fetches font binary for a family/style at runtime.
    scene-builder.ts     — Edit. addText() gains optional `derivedTextData` arg; toMessage()
                            still emits blobs[] from this.blobs (already in place).
    dom-to-scene.ts      — Edit. For each text, after computing layout fields, asynchronously
                            load the font, run text-layout, attach derivedTextData to the
                            addText call. buildSceneFromElement becomes async.
    index.ts             — Edit. buildFigmaPasteHtml is already async.
  package.json           — Add `opentype.js` (and `wawoff2` if pursuing path B).
```

No changes needed in `apps/dashboard/src/app/test/page.tsx` — it already calls the existing
`buildFigmaPasteHtml(element)` entrypoint, which stays async. The dashboard's `next/font/google`
load of Geist means the WOFF2 files will be on the same origin (under `/_next/static/media/...`)
so runtime font discovery (path B) is feasible from the `/test` page without CORS issues.

## How to verify

End-to-end check is always: load `/test` in the dashboard, click "Copy as Figma", paste into
Figma. The fixture is small enough to be a fast loop.

Local non-Figma diagnostics (already wired):
- `bun /tmp/build-iife.ts` rebuilds the kiwi bundle from `packages/kiwi/src/index.ts`.
- `bun /tmp/run-ts-pipeline.ts` runs the bundle against `index-copy.html` through Playwright
  (so DOM APIs work) and writes `/tmp/ts-paste.html`.
- `bun /tmp/decode-paste.ts /tmp/ts-paste.html` decodes the binary back into JSON for diffing.
- `bun /tmp/dump-texts.ts` lists each TEXT node's font/size/wrap state — handy for verifying
  layout fields end up the way we expect before pasting.

For derivedTextData specifically, plan to add `/tmp/decode-glyph.ts` (round-trips a known
character through encoder → decoder → expected commands) and to byte-diff our output for the
first glyph in `competitor.scene.json` against the encoder's output for the same glyph — this
catches sign/scale bugs without needing a Figma paste.

## Open questions / decisions

1. **Bundle Inter as fallback** (recommended) or skip fallback?
2. **Path A (bundled OTF) or Path B (runtime fetch)?** Recommend B with A as fallback.
3. **WOFF2 support** — needed if we want to use the dashboard's `next/font/google` cache directly. Heavier dep. Alternative: bypass next/font, ship font binaries ourselves.
4. **Glyph cache scope** — per-SceneBuilder (rebuild every paste) or module-global (cache across pastes for the same kiwi instance)? Module-global is faster but ties memory to font count.
5. **Shaping** — punt on kerning/ligatures for v1? Risk: noticeably worse spacing than CSS. Mitigation: emit `letterSpacing` so Figma's re-flow uses CSS spacing when the user edits.
6. **What to do for unsupported fonts** — emit text without derivedTextData (current behaviour, won't render in this user's Figma) or substitute with Inter? Substitute is safer.

## Risk register

- **opentype.js can't parse a font we encounter** → emit without derivedTextData, log warning.
- **Glyph coordinate sign convention mismatches** → glyphs render upside down or offset. Verify against `competitor.scene.json` blob bytes by encoding a single character and diffing against a known Figma export.
- **Wrap width disagrees with Figma's measurement** → text overflows or wraps differently. Mitigation: also send `textAutoResize: HEIGHT` so Figma re-flows on its own measurement.
- **Bundle size** — adding opentype.js (~290KB unminified) + a font file (~100KB woff2) to the dashboard. Probably fine for a dev tool route, would need re-evaluation for production.

## Order of work

1. **Encoder** (`text-glyph.ts`) — testable in isolation by encoding a known glyph and diffing against `competitor.blobs[29]`. (~30 min)
2. **Inter bundle + loader** (`fonts/`) — load OTF, parse with opentype.js, expose `getGlyph(family, style, char) → { path, advance }`. Start with bundled Inter only. (~1 h)
3. **Layout** (`text-layout.ts`) — straight-line layout for unwrapped text; verify positions visually with a single test text node. (~1.5 h)
4. **Wire into `dom-to-scene`** — flip `addText` calls to async, pass derivedTextData. (~30 min)
5. **Wrap support** — line-break logic, multi-baseline output. (~1 h)
6. **Runtime font discovery** — pull URL from stylesheets, fetch, parse. Add WOFF2 decompression if needed. (~1 h)
7. **End-to-end test** in Figma. (~30 min, plus iteration)

Stopping points where the work is shippable:
- After step 4 with Inter-only: text renders in Figma but always in Inter visuals, with correct positions. Useful as a fallback.
- After step 6: text renders in the original font from the source HTML.
