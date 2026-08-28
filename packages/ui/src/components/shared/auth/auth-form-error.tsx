"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { AuthFormErrorProps } from "../../../lib/auth-types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function AuthFormError({ error, className }: AuthFormErrorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          role="alert"
          transition={{
            height: { duration: reduceMotion ? 0 : 0.25, ease: EASE_OUT },
            opacity: { duration: 0.2, ease: "easeOut" },
          }}
        >
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-destructive text-sm",
              className
            )}
          >
            <HugeiconsIcon
              className="mt-0.5 size-4 shrink-0"
              icon={AlertCircleIcon}
            />
            <p>{error}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
