import type { Transition } from "motion/react";

/**
 * Shared motion scale for `motion/react`.
 *
 * The CSS counterpart lives in `@notra/ui/motion.css` and MUST stay numerically
 * in sync: that file feeds the Tailwind `duration-*` / `ease-*` utilities, this
 * one feeds JS-driven animation. Same scale, two consumers.
 *
 * Durations are seconds here (what `motion` expects) and milliseconds there
 * (what CSS expects).
 */

/** Seconds. Mirrors `--transition-duration-*`. */
export const DURATION = {
  /** Popover layer appearing/disappearing (menus, tooltips, selects). */
  instant: 0.1,
  /** Direct feedback on a control (hover, press, colour change). */
  fast: 0.15,
  /** An element changing state in place (expand, reveal, swap). */
  normal: 0.2,
  /** Layout-level movement (sidebar, accordion, drawer). */
  slow: 0.3,
  /** A deliberate, attention-carrying reveal (hero, score, onboarding). */
  slower: 0.5,
} as const;

/** Cubic-bezier control points. Mirrors `--ease-*`. */
export const EASE = {
  /** Default for small interactions. Tailwind's `ease-out`. */
  out: [0, 0, 0.2, 1],
  /** Strong deceleration for entrances and layout moves. */
  emphasized: [0.22, 1, 0.36, 1],
  /** Mirrored acceleration, for exits. */
  emphasizedIn: [0.7, 0, 0.84, 0],
  /** Symmetric morphs (size/position changing both ways). */
  emphasizedInOut: [0.65, 0, 0.35, 1],
} as const;

/**
 * Springs.
 *
 * Prefer these over hand-tuned stiffness/damping pairs — the codebase had six
 * near-identical variants that all read as "the same movement" to a user.
 */
export const SPRING = {
  /**
   * Shared-layout indicators: tab underlines, segmented-control pills,
   * permission markers. Anything driven by `layoutId`.
   */
  indicator: { type: "spring", bounce: 0.2, duration: 0.4 },
  /** Same role, but for dense controls where overshoot reads as sloppy. */
  indicatorFlat: { type: "spring", bounce: 0, duration: 0.3 },
  /** Elements entering, leaving or reordering a list. */
  snappy: { type: "spring", stiffness: 400, damping: 34 },
  /** Larger surfaces where `snappy` looks nervous. */
  gentle: { type: "spring", stiffness: 300, damping: 24 },
} as const satisfies Record<string, Transition>;

/** Tween using the shared scale. `duration` is a key of {@link DURATION}. */
export function tween(
  duration: keyof typeof DURATION = "normal",
  ease: keyof typeof EASE = "out"
): Transition {
  return { type: "tween", duration: DURATION[duration], ease: EASE[ease] };
}

/**
 * Transition presets for the interactions that recur across the product.
 * Reach for these before writing a bespoke `transition={{ ... }}`.
 */
export const TRANSITION = {
  /** Text/content swapping in place, error messages, status changes. */
  fade: tween("fast"),
  /** A panel, row or card entering. */
  enter: tween("normal", "emphasized"),
  /** A panel, row or card leaving. */
  exit: tween("fast", "emphasizedIn"),
  /** Something growing or shrinking (range pickers, expanding inputs). */
  resize: tween("slow", "emphasizedInOut"),
} as const satisfies Record<string, Transition>;

/** Vertical fade-in. `distance` is px; negative enters from above. */
export function fadeUp(distance = 8) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: distance },
    transition: TRANSITION.enter,
  };
}

/** Plain crossfade, for `AnimatePresence mode="wait"` swaps. */
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: TRANSITION.fade,
} as const;
