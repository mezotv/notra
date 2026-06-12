# On-screen code highlighting via frame analysis (P4)

When the transcript references code that is **already visible** in the screen-share, anchor a highlight onto the real code in the frame (an `OnScreenHighlight` overlay) instead of drawing a separate code card.

## Procedure
1. **Extract the frame** at the candidate timestamp:
   `node scripts/extract-frame.mjs final_cut.mp4 --at <t> --out frame.png`
2. **Locate the target visually.** Read `frame.png` and find the lines/token the speaker is referring to (e.g. a function name, an import, a specific line). Compute its bounding box.
3. **Normalize the box** to the composition dimensions as percentages: `{ x%, y%, w%, h% }`. These fill the `{{X}} {{Y}} {{W}} {{H}}` tokens of `OnScreenHighlight.html`.
4. **Time it** to the spoken reference + dwell (≥3s for code). The highlight sweeps/draws in, holds, fades out within its `data-duration`.
5. **Record the resolved box + BOTH inspected frame timestamps** (`t_start = start`, `t_end = start + est_duration`) and a `stability_checked` outcome (`stable` | `shortened` | `fallback_card`) in the overlay plan row, so the approval table shows exactly what will be highlighted, that the stability guard actually ran, and the user can correct coordinates.

## Stability guard (mandatory)
On-screen highlighting only works on **static** code. Before committing a highlight:
- Extract a **second frame** near the end of the intended dwell window.
- If the code region moved/scrolled/changed materially between the two frames, the pinned box would drift. In that case:
  - shorten the highlight to the stable sub-window, OR
  - fall back to a side `CodeSnippet` card (synthesize/pull the referenced code) instead of an on-screen highlight.
- Never attempt frame-by-frame tracking of scrolling code.

## Coordinate sanity
- Boxes must sit inside the active phase's screen safe zone (never over the webcam inset — see `framing-safe-zones.md`).
- After build, `npx hyperframes inspect` confirms the overlay stays on-canvas.
