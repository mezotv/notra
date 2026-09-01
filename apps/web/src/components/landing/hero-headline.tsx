"use client";

import { EngineIcon } from "@notra/ui/components/geo/engine-icon";
import { cn } from "@notra/ui/lib/utils";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  useReducedMotion,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { GEO_ENGINE_NAMES } from "@/constants/landing/geo-engines";
import {
  HERO_HEADLINE_CYCLE,
  HERO_HEADLINE_CYCLE_MS,
  HERO_HEADLINE_LINE_ONE,
  HERO_HEADLINE_LINE_TWO_PREFIX,
  HERO_HEADLINE_SUFFIX,
  HERO_WORD_SIZE_DESCENDER_EM,
  HERO_WORD_SIZE_EM,
} from "@/constants/landing/hero";
import type { HeroCycleWord } from "@/types/landing/hero";

const WORD_TRANSITION = { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const;

const WORD_CONTENT_CLASS =
  "inline-flex items-center gap-[0.16em] whitespace-nowrap px-[0.22em] leading-none";

const DESCENDER_PATTERN = /[gjpqy]/;

function wordSizeEm(word: HeroCycleWord): number {
  return DESCENDER_PATTERN.test(word.text)
    ? HERO_WORD_SIZE_DESCENDER_EM
    : HERO_WORD_SIZE_EM;
}

function listEngineNames(): string {
  const names = HERO_HEADLINE_CYCLE.map(
    (word) => GEO_ENGINE_NAMES[word.engine]
  );
  const last = names.at(-1);
  if (names.length < 2 || !last) {
    return names.join("");
  }
  return `${names.slice(0, -1).join(", ")} or ${last}`;
}

function WordContent({ word }: { word: HeroCycleWord }) {
  return (
    <>
      <EngineIcon className="size-[0.68em] shrink-0" engine={word.engine} />
      <span className="inline-block leading-none [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
        {word.text}
      </span>
    </>
  );
}

export function HeroHeadline() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const measureRefs = useRef(new Map<string, HTMLSpanElement>());
  const word = HERO_HEADLINE_CYCLE[index] ?? HERO_HEADLINE_CYCLE[0];

  useLayoutEffect(() => {
    const measure = () => {
      const next: Record<string, number> = {};
      for (const [text, element] of measureRefs.current) {
        next[text] = element.getBoundingClientRect().width;
      }
      setWidths(next);
    };
    measure();
    document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    for (const element of measureRefs.current.values()) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_HEADLINE_CYCLE.length);
    }, HERO_HEADLINE_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  if (!word) {
    return null;
  }

  const width = widths[word.text];

  return (
    <h1 className="font-display max-w-[20.5rem] text-center text-[clamp(1.5rem,calc(10.1vw-0.42rem),2.0625rem)] leading-[1.08] font-medium tracking-[-0.015em] text-[#1E1E1E] sm:max-w-[56.875rem] sm:text-[3.25rem] sm:font-semibold lg:text-[4.75rem] lg:leading-[1.12] dark:text-white">
      <span className="block whitespace-nowrap sm:inline sm:whitespace-normal">
        {HERO_HEADLINE_LINE_ONE}{" "}
      </span>
      <span className="block whitespace-nowrap sm:inline sm:whitespace-normal">
        {HERO_HEADLINE_LINE_TWO_PREFIX}{" "}
        <span className="sr-only">{listEngineNames()}</span>
        <span
          aria-hidden
          className={cn(
            "relative inline-flex h-[1em] items-center overflow-hidden rounded-[0.24em] align-middle",
            "bg-white text-[#1E1E1E] shadow-[0_0.05em_0.22em_rgba(0,0,0,0.1),0_0_0_0.0625rem_rgba(0,0,0,0.04)] dark:bg-white/[0.08] dark:text-white dark:shadow-[0_0_0_0.0625rem_rgba(255,255,255,0.12)]",
            "transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          )}
          style={width ? { width: `${width}px` } : undefined}
        >
          {HERO_HEADLINE_CYCLE.map((entry) => (
            <span
              aria-hidden
              className={cn(WORD_CONTENT_CLASS, "invisible absolute left-0")}
              key={entry.text}
              ref={(element) => {
                if (element) {
                  measureRefs.current.set(entry.text, element);
                } else {
                  measureRefs.current.delete(entry.text);
                }
              }}
              style={{ fontSize: `${wordSizeEm(entry)}em` }}
            >
              <WordContent word={entry} />
            </span>
          ))}
          <span
            className="absolute inset-0 transition-[font-size] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ fontSize: `${wordSizeEm(word)}em` }}
          >
            <LazyMotion features={domAnimation}>
              <AnimatePresence initial={false}>
                <m.span
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  className={cn(
                    WORD_CONTENT_CLASS,
                    "absolute inset-0 justify-center"
                  )}
                  exit={{ opacity: 0, y: "-0.3em", filter: "blur(6px)" }}
                  initial={{ opacity: 0, y: "0.3em", filter: "blur(6px)" }}
                  key={word.text}
                  transition={WORD_TRANSITION}
                >
                  <WordContent word={word} />
                </m.span>
              </AnimatePresence>
            </LazyMotion>
          </span>
          {width ? null : (
            <span
              className={cn(WORD_CONTENT_CLASS, "invisible")}
              style={{ fontSize: `${wordSizeEm(word)}em` }}
            >
              <WordContent word={word} />
            </span>
          )}
        </span>
        {HERO_HEADLINE_SUFFIX}
      </span>
    </h1>
  );
}
