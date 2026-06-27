"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FrameProvider } from "./remotion";
import { GithubPr } from "./scenes/github-pr";
import { HappyCustomers } from "./scenes/happy-customers";
import { TweetPost } from "./scenes/tweet-post";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const FPS = 30;

interface HeroStep {
  id: string;
  label: string;
  caption: string;
  description: string;
  Scene: () => React.JSX.Element;
  frames: number;
  staticFrame: number;
}

const STEPS = [
  {
    id: "merge",
    label: "Merge the PR",
    caption: "You ship",
    description: "Your work lands on main.",
    Scene: GithubPr,
    frames: 120,
    staticFrame: 118,
  },
  {
    id: "post",
    label: "Notra posts it",
    caption: "Auto-shared",
    description: "Drafted as a tweet, with image.",
    Scene: TweetPost,
    frames: 150,
    staticFrame: 120,
  },
  {
    id: "customers",
    label: "Customers love it",
    caption: "Users react",
    description: "The update reaches your users.",
    Scene: HappyCustomers,
    frames: 160,
    staticFrame: 130,
  },
] as const satisfies readonly HeroStep[];

export function AnimatedHero() {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const accRef = useRef(0);

  const [step, setStep] = useState(0);
  const [frame, setFrame] = useState(0);
  const [scale, setScale] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) {
        setScale(width / DESIGN_WIDTH);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.2 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || !(playing && inView)) {
      return;
    }
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      if (last !== null) {
        accRef.current += ((now - last) / 1000) * FPS;
      }
      last = now;
      const duration = (STEPS[stepRef.current] ?? STEPS[0]).frames;
      if (accRef.current >= duration) {
        accRef.current = 0;
        const next = (stepRef.current + 1) % STEPS.length;
        stepRef.current = next;
        setStep(next);
        setFrame(0);
      } else {
        setFrame(Math.floor(accRef.current));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, inView, reducedMotion]);

  const selectStep = useCallback((index: number) => {
    const settled = (STEPS[index] ?? STEPS[0]).staticFrame;
    accRef.current = settled;
    stepRef.current = index;
    setStep(index);
    setFrame(settled);
  }, []);

  const settleCurrent = useCallback(() => {
    setPlaying(false);
    const settled = (STEPS[stepRef.current] ?? STEPS[0]).staticFrame;
    accRef.current = settled;
    setFrame(settled);
  }, []);

  const activeStep = STEPS[step] ?? STEPS[0];
  const ActiveScene = activeStep.Scene;
  const displayFrame = reducedMotion ? activeStep.staticFrame : frame;
  const progress = Math.min(displayFrame / activeStep.frames, 1);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#f7f5f3]"
      onPointerEnter={settleCurrent}
      onPointerLeave={() => setPlaying(true)}
      ref={rootRef}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          opacity: scale > 0 ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      >
        <FrameProvider frame={displayFrame}>
          <ActiveScene />
        </FrameProvider>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center p-3 sm:p-4">
        <div className="flex w-[13.5rem] flex-col gap-1 rounded-[0.875rem] border border-border/60 bg-background/70 p-1.5 shadow-sm backdrop-blur-md lg:w-[15.5rem]">
          {STEPS.map((heroStep, index) => {
            const active = index === step;
            return (
              <button
                aria-label={`Step ${index + 1}: ${heroStep.label}`}
                aria-pressed={active}
                className={`group relative flex flex-col gap-1 overflow-hidden rounded-[0.625rem] border-l-2 px-3 py-2 text-left transition-colors hover:bg-foreground/5 ${
                  active
                    ? "border-primary bg-foreground/[0.03]"
                    : "border-transparent"
                }`}
                key={heroStep.id}
                onClick={() => selectStep(index)}
                type="button"
              >
                <span
                  className={`font-medium font-sans text-[0.5rem] uppercase tracking-wide ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {`0${index + 1}`} · {heroStep.caption}
                </span>
                <span
                  className={`font-medium font-sans text-[0.8125rem] leading-tight ${
                    active ? "text-foreground" : "text-foreground/70"
                  }`}
                >
                  {heroStep.label}
                </span>
                <span className="font-sans text-[0.6875rem] text-muted-foreground leading-snug">
                  {heroStep.description}
                </span>
                <span className="mt-1 h-0.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{
                      width: active ? `${progress * 100}%` : "0%",
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
