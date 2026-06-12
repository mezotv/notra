# Notra Image Generation launch video plan

Remotion video for the new image generation + export feature. Lives in `apps/video` (currently only holds `out/BrandVoice.mp4`, so we scaffold a fresh Remotion project there).

## Format

- 1920x1080, 30fps, ~44s (22 bars of the 120bpm track)
- Audio: `120bpm-music.mp3` (103s, we use the first ~44s, fade out over the last 2s)
- Scene cuts land on bars (every 60 frames). Button presses and reveals land on beats (every 15 frames).
- Theme: light dashboard (white background, `#171717` foreground) on a warm light stage (`#f7f5f3`), matching the default product theme and the landing page. Violet `#8B5CF6` as the only loud color.
- Fonts: Inter for UI, Instrument Serif for the big display lines (same as the landing hero). Via `@remotion/google-fonts`.

## The one thing the video must land

The export is not a screenshot. Notra generates the image, and "Copy for Figma" pastes it as real, editable layers (the `@notra/kiwi` clipboard encoding). That is the moment the video builds toward.

## Scenes

### 1. Cold open (0:00 to 0:04, 2 bars)
Black, then the Notra mark (lavender `#C8B2EE` swoosh from `notra-mark.tsx`) draws in on beat 1. Wordmark fades in beside it.

Copy (Instrument Serif, large):
> You shipped. Now show it.

### 2. Setup (0:04 to 0:10, 3 bars)
The dashboard content detail page slides in: a finished launch post sits in the editor. Quick beat-synced zoom toward the content area. The point: Notra already wrote the post. Something is missing next to it.

Copy (small caption, Inter):
> Notra already writes your launch posts.

Then, on the bar:
> Now it makes the images too.

### 3. Generation (0:10 to 0:18, 4 bars)
Recreate the image content view (`ImageEditor` + `TitleCard`): a 1200x630 image card starts as a shimmer skeleton, then the generated marketing image resolves in with a soft scale-and-fade. Stat chips and the title settle in with slight stagger.

Copy:
> One prompt. A 1200 by 630 image built from your release, in your brand.

(We render a believable fake "generated image" as a Remotion component: violet gradient, repo name, version badge. No screenshots, everything is code so it stays crisp.)

### 4. The export menu (0:18 to 0:26, 4 bars)
The macOS cursor moves to the top-right actions: "Download image" button plus the ButtonGroup ("Copy for Paper" with the Paper logo | chevron). Cursor clicks the chevron on a beat. The dropdown opens, recreated from the real `DropdownMenu`:

- Paper (logo, checked)
- Figma (logo)
- Wonder (logo, grayed out, "Coming soon")

Cursor selects Figma. Menu closes, button label flips to "Copy for Figma", sonner-style toast slides in:
> Copied for Figma. Paste it into your Figma file.

No on-screen copy here. The UI is the copy.

### 5. The payoff: paste into Figma (0:26 to 0:34, 4 bars)
Cut to a minimal Figma-style canvas (light, dotted grid, layers panel on the left). Cmd+V keycap overlay taps on the beat. The image lands on the canvas, and then the layers panel populates: Frame, Text, Rectangle, Image. A selection box flashes around one text layer and the user "edits" the headline live.

Copy:
> Pasted as real layers. Not a screenshot.

### 6. Targets (0:34 to 0:38, 2 bars)
Three tiles on the brand stage, beat-staggered: Paper logo, Figma logo, Wonder logo with a small "Coming soon" badge.

Copy:
> Works with Paper and Figma today. Wonder is next.

### 7. End card (0:38 to 0:44, 3 bars)
Notra mark + wordmark, the violet squircle CTA button from the landing hero (inner white ring shadow, `rounded-[1rem]`), pulsing once on the final downbeat. Music fades.

Copy:
> Image generation. Live now.
> usenotra.com  ·  Start for free

## What gets reused vs recreated

Remotion can't import the dashboard components directly (Next.js, react-query, client hooks), so UI is recreated as dumb Remotion components styled to match:

- Logos copied from `packages/ui/src/components/ui/svgs/`: `notra.tsx`, `paper.tsx`, `figma.tsx`, `wonder.tsx`
- Notra mark SVG string from `apps/web/src/components/notra-mark.tsx`
- Button, ButtonGroup, DropdownMenu, toast: rebuilt as static JSX with the exact classes/colors from `packages/ui` (read, not imported)
- Colors and radius pulled from `apps/web/src/styles/globals.css` and `apps/web/src/lib/brand/constants.ts`
- Reference for layout: `apps/dashboard/src/app/(dashboard)/[slug]/content/[id]/page-client.tsx` (lines ~979-1051) and `components/content/editors/image-editor.tsx`

## Technical setup

1. Scaffold Remotion in `apps/video` (package.json, `bun add remotion @remotion/cli @remotion/google-fonts @remotion/audio` etc.), register it in the workspace, follow the `remotion-best-practices` skill.
2. Move `120bpm-music.mp3` from the repo root into `apps/video/public/`.
3. One composition `ImageGenLaunch`, scenes as `<Sequence>` blocks, all timing derived from `BPM = 120` constants (`framesPerBeat = fps * 60 / bpm`).
4. Spring-based animations, `interpolate` with clamped extrapolation, no CSS transitions (per Remotion best practices).
5. Iterate via Remotion Studio (`bunx remotion studio`) and review frames in the browser with the agent browser CLI / Chrome tools, then `bunx remotion render` to `out/ImageGenLaunch.mp4`.

## Decisions (confirmed)

- 16:9 only, 1920x1080.
- Light dashboard theme.
- Scene 3's generated image announces Notra Image Generation itself (the video demos itself).
- End card copy: "Image generation. Live now."

## Still needed from you

- The macOS cursor as SVG (default arrow, ideally also the pointer/hand) so scenes 4 and 5 look native. Drop it anywhere in the repo and tell me the path. Fallback: I draw a close approximation in SVG.
