"use client";

import type { Transition } from "motion/react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { InstrumentRevealProps } from "@/types/instrument";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD — module reveal
 *
 * Each module powers on once its page stage goes active:
 *
 *    0ms   dark cell (opacity 0, y +0.375rem)
 *   +n     opacity 0 → 1, y +0.375rem → 0 (45ms per order step)
 *
 * Reduced motion: modules appear instantly, no offset.
 * ───────────────────────────────────────────────────────── */

const REVEAL = {
  offsetY: 6, // px each module rises while powering on
  stagger: 0.045, // seconds between neighboring modules
  spring: { type: "spring", stiffness: 380, damping: 34 },
} satisfies { offsetY: number; stagger: number; spring: Transition };

const INSTANT: Transition = { duration: 0 };

export function InstrumentReveal({
  active,
  order = 0,
  children,
  className,
}: InstrumentRevealProps) {
  const reduceMotion = useReducedMotion();
  const transition: Transition = reduceMotion
    ? INSTANT
    : { ...REVEAL.spring, delay: order * REVEAL.stagger };

  return (
    <motion.div
      animate={{
        opacity: active ? 1 : 0,
        y: active || reduceMotion ? 0 : REVEAL.offsetY,
      }}
      className={cn("flex min-w-0 flex-col", className)}
      initial={false}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
