"use client";

import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import type { AuthFormErrorProps } from "../../../lib/auth-types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function AuthFormError({ error, className }: AuthFormErrorProps) {
  const reduceMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence initial={false}>
        {error && (
          <m.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            initial={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
            role="alert"
            transition={{
              duration: reduceMotion ? 0 : 0.2,
              ease: EASE_OUT,
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
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
