---
name: produce-video
description: Use when the user wants to turn a raw talking-head / screen-share recording into a finished, edited, annotated video plus a full content package. Removes silences, flags mistakes for the user to cut, transcribes, adds transcript-synced overlays (code, on-screen code highlights, word highlights, lists, comparisons, diagrams, section labels, punch-in zooms), renders with original audio, then generates blog/socials/YouTube content. Triggers on "produce a video", "edit my video", "annotate my recording", "/produce-video".
---

# Produce Video

Take a recording the user provides and turn it into a finished video. The recording is the spine and drives the timeline; this skill edits (silence + chosen mistakes/pacing) and augments (overlays), then renders and generates launch content. It does NOT author a synthetic video — for PR-driven synthetic promos use `hyperframes-video` instead.

**Quality principle (non-negotiable): every footage step preserves the original quality.** Never let a tool re-encode the footage at low quality. De-silence and cuts run at near-lossless CRF 12 from the original (auto-editor is used only to DETECT silence, never to encode — its default crushes footage to ~0.6 Mbps), and the render runs at CRF 12. CRF gives small files for static screencasts; that is full quality, not loss.

## Relation to other skills (delegate, don't re-derive)
- **`/transcribe-video`** — all transcription (returns word-level `transcript.words.json`). Invoke it; do not transcribe by hand.
- **`hyperframes`** — composition authoring rules (Visual Identity Gate, Layout Before Animation, timeline contract, video/overlay layering). **Invoke before writing/mounting any composition HTML.**
- **`hyperframes-cli`** — every `npx hyperframes` command (init, lint, inspect, preview, render).
- **`gsap`** — GSAP timeline/easing patterns for overlays.
- **`youtube-copy`** — YouTube title/description/tags/chapters (P6).
- **`blog-post`** — the blog post (P6).
- **`social-copy`** — X/Bluesky/LinkedIn/Reddit copy (P6).

## Bundled assets
- `scripts/desilence.mjs` — auto-editor silence removal + before/after duration.
- `scripts/extract-frame.mjs` — single-frame grab (framing detection + on-screen highlight).
- `scripts/bake-cuts.mjs` — ffmpeg trim/concat cutter (dense keyframes) used in P2.
- `templates/overlays/*.html` — 9 overlay sub-composition templates (filled per instance; sub-comps are standalone HTML docs in the installed CLI — read each file's header comment).
- `templates/project/{DESIGN.md,styles.css}` — Visual Identity Gate + brand `var(--brand-*)` tokens the overlays consume.
- `references/` — `mistake-detection.md`, `overlay-triggers.md`, `framing-safe-zones.md`, `frame-analysis.md`.
- **P6 content generation is delegated to the `youtube-copy`, `blog-post`, and `social-copy` skills** (no vendored LLM script).

## Gates (non-negotiable)
1. **P2 mistake review is VISUAL, never terminal** — whenever ≥1 flag exists, the agent ALWAYS builds the hyperframes marker preview (markers on the video at each flagged span) and launches it, so the user decides by *watching*. Do NOT present the flags as a terminal table/question for the user to decide from, and do NOT make the preview optional or ask "want me to show you?" — just build it and open it. A short terminal summary of the flags is fine, but the decision surface is the preview. Never auto-apply a cut/ramp.
2. **P4 overlay plan approval** — present the timestamped overlay table; no build until approved.
3. **Preview is always agent-launched** — for both the P2 review and the P5 review, the agent starts `npx hyperframes preview` and opens the browser tab itself. NEVER ask the user to run preview or open a URL, and NEVER substitute a terminal-only summary for the live preview.
4. **Explicit-render HARD-GATE** — render runs ONLY on an explicit user render command ("render", "ship it"). After a render, edit requests return to the preview loop and do NOT re-render until the user explicitly says so again. Every render needs its own fresh command. This overrides any "use sane defaults / non-interactive / just ship it" phrasing.

"Use sane defaults" / "don't ask questions" skips the *configuration questions* (P0) and the iteration prompting — it NEVER skips the approval gates, the agent-launched preview, or the explicit-render gate.

## Process

### Preflight — check dependencies & skills (run FIRST, before P0)
Verify the environment before doing any work; warn the user about anything missing and how to fix it.
- **auto-editor** (required for P1 de-silence): run `auto-editor --version`. If it is not installed, STOP and tell the user: *"auto-editor is not installed - install it with `pipx install auto-editor` (or `pip install auto-editor`), then re-run."* Do not attempt P1 without it.
- **ffmpeg / ffprobe** (REQUIRED — P2 cuts, P4 frame analysis, P5 render, audio): run `ffmpeg -version`. If missing, STOP and tell the user to install ffmpeg and add it to PATH. The pipeline cannot run without it.
- **Docker** (for `/transcribe-video`): `docker info`. Warn if the daemon is down (start Docker Desktop).
- **Node >= 22**: `node --version`. Warn if older.
- **Required skills** — confirm these are available (try to invoke / check the skill list); warn for any missing and which phase it blocks:
  - `transcribe-video` (P2/P3 transcription), `hyperframes` + `hyperframes-cli` + `gsap` (P2/P4/P5 composition & render), `youtube-copy` + `social-copy` (P6). `blog-post` only if the user opts into a blog (P6, optional).
- Summarize the preflight result in one short block (what's present, what's missing). Only proceed past a missing **required** dependency/skill if the user explicitly says to continue without it (and note the degraded result).

### P0 — Input & configuration
- Input: path to the raw recording (required).
- Optional: a repo/files for real code grounding; visual style/brand (else run the `hyperframes` Visual Identity Gate — detect from the repo, else ask 3 style questions; write `templates/project/DESIGN.md` + brand values into `styles.css`); overlay **density** (sparse / balanced / rich).
- **Single output folder (`<OUT>`):** everything this skill produces lives under ONE folder, default `<recording-dir>/<video-slug>-produced/` (override with a user-supplied path). Create it now. Final structure:
  ```
  <OUT>/
    final.mp4                 # rendered video (P5)
    hyperframes/              # the HyperFrames project: index.html, styles.css, DESIGN.md, compositions/, renders/ (P4–P5)
    transcript.txt            # final edited transcript (P3 / P6)
    transcript.srt
    transcript.words.json
    youtube.md                # P6
    socials.md                # P6
    blog.md                   # P6
    .work/                    # intermediates: 01_desilenced.mp4, 02_edit_N.mp4, frames/ (prunable in P7)
  ```
  All subsequent phases write inside `<OUT>` — never scatter outputs elsewhere. `<work>` below = `<OUT>/.work`.

### P1 — De-silence (lossless)
```
node scripts/desilence.mjs <input> --out <work>/01_desilenced.mp4 --margin 0.3s
```
`desilence.mjs` uses auto-editor ONLY to detect the silent ranges (`--export v3`), then cuts the ORIGINAL with ffmpeg at near-lossless CRF 12, keeping the original audio. **Do NOT let auto-editor encode the output** — its default re-encode crushes the footage to ~0.6 Mbps and permanently blurs it (faces especially); no downstream bitrate can recover that. Report before/after duration and seconds removed. This becomes the working copy.

### P2 — Mistake & pacing review loop  (approval gate)
1. Transcribe the working copy: invoke `/transcribe-video` on `<work>/01_desilenced.mp4` with `--out <work>` → working transcript (intermediate; superseded by the P3 final transcript).
2. Detect flags per `references/mistake-detection.md` (cuts + speed-ramps), snapped to word boundaries.
3. **Always (whenever ≥1 flag exists) build the visual review.** Scaffold a lightweight hyperframes project with the de-silenced video as the base track; place visually-distinct temporary markers ON THE VIDEO at each flagged span (cut = red strike, ramp = amber fast-forward, each labeled with the excerpt + its index). **Agent starts `npx hyperframes preview` and opens the browser itself** (per `references/framing-safe-zones.md`). This is the decision surface — never replace it with a terminal table. A one-line terminal note ("3 flags marked in the preview — review and tell me which to cut/ramp/keep") is the most the terminal should carry.
4. The user watches the marked preview and picks per span: cut / speed-ramp (factor, default ~1.5–2×) / leave / add their own ranges.
5. Bake selections → `<work>/02_edit_N.mp4`, then re-preview:
   - **Cuts:** use `node scripts/bake-cuts.mjs <input> --out <work>/02_edit_N.mp4 --cut s,e --cut s,e …` (ffmpeg trim/concat at near-lossless CRF 12 by default — trims video+audio identically in one pass). **Do NOT use auto-editor `--cut-out` for the mistake cuts** — its variadic arg mis-assigns the last range as a positional input, it re-encodes lossily, and a select-filter approach desyncs audio.
   - **Speed-ramps:** auto-editor `--set-speed-for-range speed,s,e` (pitch preserved); pass ONE range per invocation, or place `--set-speed-for-range` last on the command line, to dodge the same variadic-arg pitfall.
   - All cut/ramp timestamps are on the **de-silenced** timeline (the transcript the flags came from). Apply cuts and ramps in the same round against that timeline.
6. Loop until the user says "done". Drift guard: after ~10 rounds offer to reset to an earlier intermediate. Final artifact: `<work>/final_cut.mp4`.

Cuts and ramps are baked into the footage HERE (before P3) so the final transcript's word timestamps match the edited timeline.

### P3 — Final transcription
Invoke `/transcribe-video` on `<work>/final_cut.mp4` with `--out <OUT>` so `transcript.txt` / `transcript.srt` / `transcript.words.json` land at the top of the output folder. This word-timestamped transcript is the sync source for all overlays (P4) and the input to content generation (P6).

### P4 — Overlay design & build  (approval gate)
1. **Framing detection** (`references/framing-safe-zones.md`): sample frames with `extract-frame.mjs`, classify phases, confirm phases + safe zones with the user.
2. **Overlay-trigger detection** (`references/overlay-triggers.md`): scan the word-timestamped transcript → overlay plan rows `{start, est_duration, type, content, safe_zone, why}`. For on-screen code, use `references/frame-analysis.md` (extract frame → locate → normalized box → stability guard). For code cards, repo-if-available-else-synthesize (flag synthesized).
3. **Self-improvement pass** (≥2 iterations): honor density, enforce gaps + dwell minimums, validate every overlay against the active phase's safe zone.
4. **Approval gate:** present the timestamped table; user edits/removes/retimes/adds. Synthesized code shown for verification. No build until approved.
5. **Build** (invoke `hyperframes` + `gsap` first):
   - `npx hyperframes init <OUT>/hyperframes --video <OUT>/.work/final_cut.mp4` (the project lives at `<OUT>/hyperframes`; base: video track 0 `muted playsinline`; audio on a separate track at volume 1 so the voice plays). **Read the generated `index.html` to learn this CLI version's sub-composition include syntax.**
   - Copy `templates/project/styles.css` (with the confirmed brand values) into `<OUT>/hyperframes`.
   - For each approved row: instantiate the matching `templates/overlays/*.html`, give it a unique composition id + `data-composition-id`, fill its `{{tokens}}`, set `data-start` = the transcript timestamp and `data-duration` = the dwell, mount it above the video. Punch-in zooms scale the video's WRAPPER div (never the `<video>`).
   - Output dimensions inherit the source recording.
   - **Readability (non-negotiable): all overlay text must be clearly legible over ANY video background.** Every text group sits on a near-opaque dark panel (`rgba(8,10,14,0.92)`, rounded, subtle border/shadow); titles/body are white (`var(--brand-text)`), secondary/kicker/meta are light slate (`#CBD5E1`). NEVER use `var(--brand-accent)`/`var(--brand-primary)` for body/subtitle/kicker text — accent is for bars, borders, marker sweeps, icons, and big display words only (and only when they clear ~4.5:1 on the panel). When unsure, make text white. `npx hyperframes validate` (WCAG contrast) must pass with zero contrast warnings.

### P5 — Preview & render  (mandatory agent-launched preview + explicit-render gate)
- `npx hyperframes lint` + `npx hyperframes inspect` (overflow + safe zones) + `npx hyperframes validate` (contrast). Fix until clean.
- **Agent starts `npx hyperframes preview` and opens the browser.** Freeform iteration loop on overlays.
- Pre-render audits: every overlay in its phase's safe zone; dwell minimums; no two overlays fighting the same region simultaneously; lint/inspect/validate clean.
- **On the user's explicit render command only:** render at near-lossless CRF 12. The default `standard` quality encodes at ~1.4 Mbps and visibly crushes footage; always pass a low CRF:
  ```
  npx hyperframes render --output <OUT>/final.mp4 --crf 12
  ```
  (run from `<OUT>/hyperframes`. CRF 12 is near-lossless; do NOT use `--video-bitrate` expecting a big file — for static screencasts CRF produces a small file at full quality, and that is correct, not low quality.) Final mp4 keeps original audio. After render, further edits return to the loop and require a fresh explicit render command.
- **Quality note:** the Chrome capture is a lossless 1:1 screenshot (verified: render input == output for both text and faces), so a low-CRF render preserves the footage it is given. The ONLY thing that destroys quality is a lossy upstream step — which is why P1 de-silence and P2 cuts both run at near-lossless CRF 12 from the original. Do not add extra re-encode passes. For absolute zero-generation footage, an advanced path is to render overlays-only to a transparent `--format webm`/`mov` and ffmpeg-composite them over the cut footage (punch-in zoom then applied via ffmpeg) — rarely needed.

### P6 — Content generation (delegated to specialized skills)
Generate the launch content by **invoking dedicated skills**, each on the **final edited transcript** (P3 — pass the timestamped `transcript.srt` so YouTube chapters get accurate times), writing each output into `<OUT>`:
- **`youtube-copy`** → `<OUT>/youtube.md` (click-worthy title, above-the-fold description, tags, and timestamped chapters from the SRT). Default on.
- **`social-copy`** → `<OUT>/socials.md` (X + thread, Bluesky, LinkedIn, Reddit). Default on.
- **`blog-post`** → `<OUT>/blog.md` (full blog post from the transcript). **Optional** — ask the user "Want a blog post too?" and only run it if they say yes (default: skip). A blog is a bigger artifact many videos don't need.

Invoke each via the Skill tool with the transcript as the source; they own their own quality rules. Do NOT use a monolithic LLM script for this. If a skill is unavailable, note it and continue with the others (the rendered video is already saved).

**Writing rule for ALL generated text (titles, descriptions, chapters, blog, socials): never use em-dashes (— / –), use a hyphen `-`.**

### P7 — Cleanup & handoff
- Confirm `<OUT>` contains the consolidated result: `final.mp4`, `hyperframes/`, `transcript.*`, `youtube.md`, `socials.md`, `blog.md`.
- Offer to prune `<OUT>/.work/` (intermediates: de-silenced/cut files, extracted frames). The user owns disposition.
- **Open `<OUT>` in the file explorer for the user** and report the single folder path.

## Requirements
Docker (for `/transcribe-video`), auto-editor + ffmpeg, Node ≥22, a HyperFrames-capable environment, and an LLM provider for P6.
