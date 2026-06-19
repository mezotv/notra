# `apps/web` — Design Guidelines

This is the design reference for `apps/web`, the public marketing, blog,
changelog, and brand site. It captures the conventions already in the codebase so
new pages and components feel like they belong. When something here conflicts with
what you find in the code, the code wins — update this file to match.

Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · `@notra/ui`
(shadcn-style components) · Motion · next-themes**. Quality is gated by Ultracite
(Biome) — run `bun x ultracite fix` before committing.

---

## Principles

- **Editorial, not generic SaaS.** A serif display face, hairline rules, and
  hatch-pattern fills give the site a publication feel. Lean into restraint:
  whitespace and typography do the work, not boxes and shadows.
- **Flat by default.** In dark mode every shadow token is zeroed out. Depth comes
  from borders and background contrast, not drop shadows.
- **One accent, used sparingly.** The violet primary marks the path to action
  (CTAs, links, highlights). If everything is accented, nothing is.
- **Token-first.** Always reach for semantic CSS variables / Tailwind tokens
  (`bg-background`, `text-muted-foreground`, `border-border`). Never hardcode a hex
  value in a component — add or use a token instead.
- **Light and dark are equals.** Every surface must be designed in both themes. The
  default lands on the user's system preference via `next-themes`.

---

## Color

Defined in `src/styles/globals.css` (`:root` and `.dark`) and surfaced as Tailwind
tokens via `@theme inline`. Use the **semantic** token, not the raw value.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` / `foreground` | `#fff` / near-black | `hsl(233 7% 8%)` / near-white | Page surface and text |
| `primary` | `oklch(0.6056 0.2189 292.7172)` (≈ `#8B5CF6`) | same | Accent: CTAs, links, highlights |
| `primary-hover` | `oklch(0.5 0.22 292.72)` | — | Primary button hover |
| `muted` / `muted-foreground` | `#f5f5f5` / `#737373` | `#262626` / `#a3a3a3` | Secondary surfaces and subdued copy |
| `secondary`, `accent` | light grays | dark grays | Hover/fill states |
| `border` / `input` | `hsl(0 0% 89.8%)` | `hsl(0 1% 17%)` | Hairlines, dividers, field borders |
| `destructive` | `hsl(0 84% 60%)` | `hsl(358 100% 50%)` | Errors, destructive actions |
| `ring` | violet | violet | Focus rings |

Brand palette (logo/marketing assets) lives in `src/lib/brand/constants.ts` —
Primary `#8B5CF6`, Lavender `#C8B2EE`, Ink `#1E1E1E`, Cream `#F6F3F1`. The `/brand`
route is the source of truth for external brand usage.

Rules of thumb:
- Body copy is `text-foreground`; supporting copy is `text-muted-foreground` or
  `text-foreground/80`.
- Accent a single word or phrase in a heading with `text-primary` — don't color the
  whole heading.
- Use `border-border/60`–`/70` for the faint structural rules (page edges, section
  dividers); reserve full-opacity borders for cards and inputs.
- Text selection is tinted violet (set globally in `globals.css`).

---

## Typography

Two Google fonts, loaded in `src/app/layout.tsx` and exposed as CSS variables:

- **Inter** — `font-sans` (`--font-inter`). UI, body, most headings.
- **Instrument Serif** — `font-serif` (`--font-instrument-serif`), weight 400 only.
  The display face: the hero `h1` and editorial accents. Use at large sizes; never
  for body copy or UI controls.

Conventions:
- The hero headline uses `font-serif font-normal` and scales fluidly
  (`text-[2rem]` → `lg:text-[5rem]`) with tightened `leading`.
- Section headings use `font-sans font-semibold`, `tracking-tight`, balanced with
  `text-balance`; body uses `font-medium` for marketing emphasis.
- Use `text-balance` on headings and `text-pretty` on multi-line paragraphs.
- Long-form content (blog, changelog, legal) renders through the Tailwind
  `@tailwindcss/typography` `prose` classes — see `globals.css` for the code-block
  and copy-button overrides.

---

## Spacing, layout & shape

- **Container.** Content is centered and capped at `lg:max-w-7xl` with responsive
  gutters (`px-4 sm:px-6 md:px-8 lg:px-0`). The global frame, vertical edge rules,
  navbar, and footer live in `src/components/site-shell.tsx` — page files render
  only their `<main>` content inside it.
- **Vertical rhythm.** Scale gaps and top padding up with the breakpoint
  (`gap-3 sm:gap-4 md:gap-5 lg:gap-6`, `pt-28 … lg:pt-36`). Sections are separated by
  full-width hairline rules (`border-border border-y`), not large margins alone.
- **Radius.** Base `--radius` is `0.625rem` (light) with `radius-sm/md/lg/xl`
  derived from it. Buttons and CTAs use a larger pill radius (`rounded-[1rem]`,
  `supports-[corner-shape:round]:rounded-[1.25rem]`).
- **Squircles.** Buttons are squircled via the `@toolwind/corner-shape` plugin —
  `[data-slot="button"]` gets `corner-squircle` globally, and CTAs add it explicitly.
  Prefer `corner-squircle` over a plain large radius for primary surfaces.
- **Decoration.** `HatchPattern` (`src/components/hatch-pattern.tsx`) provides the
  diagonal-line fills behind CTAs and section breaks; `HeroGradient` provides the
  soft top glow. Use these instead of inventing new background treatments.

---

## Components

- **Source shared primitives from `@notra/ui`** (`@notra/ui/components/ui/*`) —
  Button, DropdownMenu, etc. Don't rebuild a primitive that already exists there.
- `apps/web/src/components/*` holds page-specific composition (sections, cards,
  navbar, footer). Keep one component per file, named in kebab-case.
- **Buttons:** primary = `bg-primary hover:bg-primary-hover text-primary-foreground`
  with the squircle + inset highlight ring
  (`shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]`); secondary =
  `variant="outline"`. To render a button as a link, use the `render` prop
  (`render={<Link href=… />}` with `nativeButton={false}`) rather than nesting.
- **Icons:** Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`) via
  `<HugeiconsIcon icon={…} />`. Stay within this set for consistency.
- **CTAs that drive signups** go through `TrackedSignupLink` /
  `TrackedAiSummaryLink` so analytics fire — don't hand-roll the signup `<a>`.
- Heavy below-the-fold sections are `next/dynamic`-imported on the homepage; follow
  that pattern for new large sections.

---

## Motion

- Animate with **Motion** (`motion/react`). Wrap interactive animations in
  `LazyMotion` + `domAnimation` and use the `m.*` components (as the navbar does) to
  keep the bundle small.
- **Always honor `useReducedMotion()`** — disable or shorten transforms when the user
  prefers reduced motion.
- House easings: `[0.32, 0.72, 0, 1]` for primary movement, `[0.25, 0.1, 0.25, 1]`
  for swaps. Keep durations short; motion should feel like polish, not spectacle.
- Toasts use `sonner` (`<Toaster />` mounted in the root layout).

---

## Accessibility & quality

- Semantic HTML and heading hierarchy first; use `<button>`/`<nav>`/`<main>`, not
  `div` + role.
- Maintain visible focus styles — the violet `ring` token is wired up globally
  (`outline-ring/50`); don't remove focus outlines.
- Provide meaningful `alt` text; use `next/image` (`<Image>`), never raw `<img>`.
- External links that open a new tab need `rel="noopener"`.
- Design every state in both light and dark, and verify at the `sm`/`md`/`lg`
  breakpoints the layout already targets.
- For a deeper audit, run the repo's `web-design-guidelines` skill (Vercel's Web
  Interface Guidelines) against your changed files.

---

## Checklist before shipping a page or component

- [ ] Uses semantic tokens, no hardcoded colors
- [ ] Looks correct in light **and** dark mode
- [ ] Responsive across `sm` / `md` / `lg`
- [ ] Serif reserved for display; Inter for everything else
- [ ] Accent (`primary`) used sparingly and purposefully
- [ ] Reuses `@notra/ui` primitives and existing section patterns
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Keyboard-navigable with visible focus; images have `alt`
- [ ] `bun x ultracite fix` passes
