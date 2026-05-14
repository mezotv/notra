# figma-clipboard

Reverse-engineered toolkit for Figma's "Copy as HTML" clipboard format.
Decodes existing Figma pastes and produces new ones from arbitrary HTML.

## Format we reverse-engineered

When Figma copies a selection, it puts an HTML fragment on the clipboard:

```html
<meta charset='utf-8'>
<html><head><meta charset="utf-8"></head><body>
  <span data-metadata="<!--(figmeta)BASE64_JSON(/figmeta)-->"></span>
  <span data-buffer="<!--(figma)BASE64_BINARY(/figma)-->"></span>
  <span style="white-space:pre-wrap;">Paste from divriots</span>
</body></html>
```

`data-metadata` is base64 JSON: `{ "fileKey", "pasteID", "dataType": "scene" }`.

`data-buffer` is base64 binary with the layout:

```
offset  size  contents
0       9     magic "fig-kiwij"
9       3     padding 0x00 0x00 0x00
12      4     u32 LE: schema chunk length
16      N     raw DEFLATE-compressed Kiwi schema
16+N    4     u32 LE: data chunk length
...     M     raw DEFLATE-compressed Kiwi-encoded Message
```

The schema is a 65 KB Kiwi schema (580 definitions). The data is a `Message`
containing `nodeChanges: NodeChange[]` -- a flat list of nodes linked into a
tree via `parentIndex.guid` and ordered by `parentIndex.position` (fractional
strings like `!`, `"`, `#`).

Kiwi (https://github.com/evanw/kiwi) is Evan Wallace's binary schema format.
Wire details:

- varint: LEB128, 7 bits/byte, MSB = continuation
- int: zigzag-encoded varint
- string: null-terminated UTF-8
- struct: fields in declaration order, no terminator
- message: pairs of (field-id varint, value), terminated by field-id = 0
- enum: varint of the field's value
- float: 4 bytes with the rightmost 9 bits rotated to the left; 0.0 collapses
  to a single 0 byte

## Files

Core codec (Python):
- `kiwi.py` -- Kiwi schema + data encode/decode
- `packer.py` -- HTML envelope, chunking, DEFLATE
- `scene_builder.py` -- Programmatic Document/Canvas/Frame/Text construction
- `figma-schema.bin` -- Captured 65 KB Kiwi schema (used at runtime)

HTML -> Figma:
- `extract-layout.js` -- Playwright DOM walker (computed boxes + styles)
- `html_to_figma.py` -- Maps a layout tree to Figma nodes
- `convert.sh` -- One-shot CLI

Diagnostics:
- `extract.py` -- Pull metadata + buffer out of a Figma paste
- `roundtrip.py` -- Byte-identical decode/encode test
- `build_test.py` -- Build a minimal scene from scratch
- `probe.py`, `chunks.py` -- Format probes (kept as a record)

Reference sample:
- `competitor.figma-paste.html` -- The Figma clipboard paste this work started from
- `competitor.scene.json` -- Decoded scene
- `competitor.schema.json` -- Decoded schema

The renderable HTML mockup at `../competitor.html` is a hand-coded recreation
of what the design looks like in a browser (the Figma binary itself contains
no original HTML to extract).

## Usage

### Convert HTML -> Figma paste

```bash
./convert.sh path/to/input.html path/to/output.html
```

Open the output file, select all (Cmd+A), copy (Cmd+C), then paste into Figma.

### Decode an existing Figma paste

```bash
python3 extract.py path/to/paste.html
```

Produces `paste.meta.json` and `paste.buffer.bin`.

### Build a scene programmatically

See `build_test.py` for a small example: a Card frame with two TEXT children.

## Status

The codec is solid: decoding then re-encoding competitor.figma-paste.html
produces byte-identical output. Our clipboard HTML also re-parses cleanly
through our own decoder.

The HTML -> scene mapper currently handles:
- `<div>` -> FRAME (absolute position, size, solid background)
- Text content -> TEXT (font family, size, weight, color)
- `<svg>` -> placeholder FRAME

Not yet supported (needs more schema work):
- Borders, border radius, shadows
- Gradients, image fills
- Real SVG -> vector network conversion
- Auto-layout inference from CSS flex

A separate TypeScript port lives under `packages/figma-clipboard` (in
progress) for an in-browser "Copy as Figma" button.
