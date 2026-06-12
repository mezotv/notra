# DESIGN — {{PROJECT_NAME}}

> The HyperFrames Visual Identity Gate requires this file before any composition HTML is written.
> The skill fills these from the detected/confirmed brand (P0). Overlays must trace every color/font back here.

## Style Prompt
{{ONE_PARAGRAPH_STYLE — mood, energy, how motion should feel. e.g. "Clean, technical, confident. Snappy entrances, calm holds. Brand blue accents over a near-black canvas."}}

## Colors
- Primary: `{{PRIMARY_HEX}}` — accents, key emphasis, marker sweeps
- Accent: `{{ACCENT_HEX}}` — secondary highlights
- Background: `{{BG_HEX}}` — card/panel backgrounds (overlays are translucent over the video)
- Text: `{{TEXT_HEX}}`
- Muted: `{{MUTED_HEX}}` — captions, secondary labels

(These map 1:1 to the `var(--brand-*)` tokens in `styles.css`.)

## Typography
- Display/body: `{{FONT}}`
- Mono (code): `{{MONO_FONT}}`

## Motion
- Entrances ~0.4s, holds per the dwell table, exits ~0.3s. Vary eases. Deterministic only.

## What NOT to Do
- Do not cover the speaker's face / webcam inset (see `references/framing-safe-zones.md`).
- Do not fill the whole frame with an opaque overlay.
- Do not put text directly over the video — every text group gets a near-opaque dark backing panel so it's readable over any background.
- Do not use accent/primary color for body/subtitle/kicker text (low contrast). Titles = white, secondary = light slate `#CBD5E1`. Accent is for bars/borders/marks only. `hyperframes validate` must pass with zero contrast warnings.
- Do not animate the `<video>` element directly (zoom scales a wrapper div).
