"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { AuthFieldErrorProps } from "../../../lib/auth-types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function AuthFieldError({ id, error }: AuthFieldErrorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-live="polite" id={id}>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            animate={{ height: "auto", opacity: 1 }}
            className="overflow-hidden text-destructive text-sm"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT },
              opacity: { duration: 0.15, ease: "easeOut" },
            }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
