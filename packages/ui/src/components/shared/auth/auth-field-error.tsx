"use client";

import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import type { AuthFieldErrorProps } from "../../../lib/auth-types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function AuthFieldError({ id, error }: AuthFieldErrorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-live="polite" id={id}>
      <LazyMotion features={domAnimation} strict>
        <AnimatePresence initial={false}>
          {error && (
            <m.p
              animate={{ opacity: 1, y: 0 }}
              className="text-destructive text-sm"
              exit={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
              initial={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
              transition={{
                duration: reduceMotion ? 0 : 0.15,
                ease: EASE_OUT,
              }}
            >
              {error}
            </m.p>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
