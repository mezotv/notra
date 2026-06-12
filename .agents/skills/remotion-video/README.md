# remotion-video

Generate an actual rendered `mp4` + poster image from a PR, feature, or product change — using [Remotion](https://www.remotion.dev/) (React-based video).

Resolves the input into a narrative (hook → code moments → CTA), generates a Remotion project, opens preview in Remotion Studio, iterates with you, then renders `video.mp4` and `poster.jpg` for X/LinkedIn/social.

This skill produces a *video file*. If you want a textual script instead, use `video-script`. Counterpart to `hyperframes-video` — same workflow shape, different render stack.

## Inputs

In resolution order:

1. Path to a marketing brief (`.md` containing "Executive Summary" or "Key Messages")
2. Path to a blog post
3. Path to a changelog
4. GitHub PR URL or `#1234`
5. Git ref range — `v1.0...v2.0`
6. File or directory path
7. Freeform text

When invoked from `/marketing-pipeline` with both a PR *and* upstream brief/blog paths, the skill reads both — PR for technical accuracy, upstream content for positioning and tone.

## Invoke

```
/remotion-video #1234
/remotion-video .tmp/marketing-brief.md
```

Or trigger by description:

> "Render a 30-second promo video for the auth refactor."
> "Make a video for X/LinkedIn from this blog post."

## Output

- `video.mp4` — the rendered video (default 30s, 16:9 unless configured otherwise)
- `poster.jpg` — first-frame poster image
- Optionally retains the Remotion project directory (`remotion/`) for further hand-tuning

Default location: `marketing/<feature-slug>/` or wherever the parent `marketing-pipeline` puts shared output.

## How it works

Seven phases: discovery, configuration (duration, aspect ratio, project location, brand colors/fonts/logo), narrative planning (motif, hook, scene plan), scaffold the Remotion project, first draft + iterate via Studio preview (freeform loop), render, cleanup. Phases 1, 3, 5, and 7 have explicit approval gates.

Brand auto-detection scans the repo for colors, fonts, and logo assets so the video matches the product visually — see [`brand-detection.md`](./brand-detection.md).

## Files

- [`SKILL.md`](./SKILL.md) — the skill itself
- [`brand-detection.md`](./brand-detection.md) — how the skill scans for brand assets
- [`patterns/`](./patterns) — reusable scene patterns (hook types, code reveals, CTAs)
- [`templates/`](./templates) — starter compositions
- [`hooks/`](./hooks) — pre-render audit hooks (storytelling, hook rules, motif presence, pacing variance, value-prop timing, contrast)
- [`references/`](./references) — supporting documentation referenced by the skill
