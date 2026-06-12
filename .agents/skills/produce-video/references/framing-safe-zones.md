# Framing-phase detection & safe zones (P4)

A single recording often shifts framing (e.g. centered talking-head intro → webcam-corner + screen-share). Overlays must land where they don't cover the speaker, and the right zone changes per phase.

## Detect phases
1. Sample frames across `final_cut.mp4` at intervals (every ~5–10s, denser near suspected transitions) with `scripts/extract-frame.mjs <video> --at <t> --out <png>`.
2. Visually classify each sample:
   - **centered_talking_head** — face/upper body roughly centered, no UI.
   - **webcam_screenshare** — a small webcam inset (usually a corner) + screen/slides filling the rest.
   - **other / full_screenshare** — no visible face.
3. Collapse adjacent same-class samples into phases; refine the boundary by sampling a few frames around each change.
4. **Present detected phases to the user and confirm** before planning overlays:
   > Phase 1 (0:00–0:28) centered talking head → safe zones: lower-third, L/R rails, full-screen takeover OK in pauses.
   > Phase 2 (0:28–end) webcam top-left + screen share → safe zone: full screen EXCEPT the webcam corner.

## Safe zones per phase
- **centered_talking_head:** keep the central vertical band (~30–70% width) clear. Use lower-third (bottom ~22%), left rail, right rail; full-screen takeovers allowed only during pauses/no-face moments.
- **webcam_screenshare:** the screen area is the stage; exclude a margin around the webcam inset (detect which corner from the frames). On-screen code highlights and punch-in zooms operate on the screen content, never over the webcam.
- **other/full_screenshare:** most of the frame is usable; still avoid the very edges (title-safe ~5%).

Express each zone as a rectangle in normalized coords; every overlay row records the zone active at its `start`, and the build validates placement against it. `npx hyperframes inspect` then confirms nothing spills off-canvas.

## P2 review markers (mistake/pacing preview)
When previewing flagged mistakes/draggy spans (P2), the **agent always launches** `npx hyperframes preview` and opens the browser itself — the user is never asked to start it. Place a temporary on-screen marker at each flagged span's timestamp, visually distinct for cut (e.g. red strike) vs speed-ramp (e.g. amber fast-forward), labeled with the excerpt, so the user can find each in context.
