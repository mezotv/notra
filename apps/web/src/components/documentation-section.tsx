"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import automationPreview from "../../public/automation.webp";
import logsPreview from "../../public/logs.webp";

export default function DocumentationSection() {
  const [activeCard, setActiveCard] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3);
      setAnimationKey((prev) => prev + 1);
    }, 7000);
  }, []);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  const handleCardClick = (index: number) => {
    setActiveCard(index);
    setAnimationKey((prev) => prev + 1);
    startInterval();
  };

  return (
    <div className="flex w-full flex-col items-center justify-center shadow-[inset_0_-1px_0_var(--border)]">
      <div className="flex items-center justify-center gap-6 self-stretch px-6 py-12 shadow-[inset_0_-1px_0_var(--border)] md:px-24 md:py-16">
        <div className="flex w-full max-w-[586px] flex-col items-center justify-start gap-4">
          <div className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[60px]">
            From shipped code to published content
            <Link href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
              <span className="cursor-pointer text-primary">.</span>
            </Link>
          </div>
          <div className="self-stretch text-center font-normal font-sans text-base text-muted-foreground leading-7">
            Notra follows your workflow, picks up on what matters,
            <br />
            and writes the first draft so you don't have to.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-start self-stretch overflow-hidden px-4 md:px-9">
        <div className="flex flex-1 flex-col items-center justify-start gap-6 py-8 md:flex-row md:gap-12 md:py-11">
          <div className="order-2 flex w-full flex-col items-center justify-between gap-4 md:order-1 md:w-auto md:max-w-[400px] md:self-stretch">
            <button
              className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden border border-[rgba(2,6,23,0.08)] transition-all duration-300 ${
                activeCard === 0 ? "border-border bg-white" : ""
              }`}
              onClick={() => handleCardClick(0)}
              type="button"
            >
              <div
                className={`h-0.5 w-full overflow-hidden bg-primary/8 ${activeCard === 0 ? "opacity-100" : "opacity-0"}`}
              >
                <div
                  className="h-0.5 animate-[progressBar_7s_linear_forwards] bg-primary will-change-transform"
                  key={
                    activeCard === 0
                      ? animationKey
                      : `inactive-0-${animationKey}`
                  }
                />
              </div>
              <div className="flex w-full flex-col gap-2 px-6 py-5">
                <div className="flex flex-col justify-center self-stretch font-sans font-semibold text-foreground text-sm leading-6">
                  Auto-generate changelogs
                </div>
                <div className="self-stretch whitespace-pre-line font-normal font-sans text-[13px] text-muted-foreground leading-[22px]">
                  Every merged PR becomes a changelog entry.
                  {"\n"}
                  No more manual release notes.
                </div>
              </div>
            </button>

            <button
              className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden border border-[rgba(2,6,23,0.08)] transition-all duration-300 ${
                activeCard === 1 ? "border-border bg-white" : ""
              }`}
              onClick={() => handleCardClick(1)}
              type="button"
            >
              <div
                className={`h-0.5 w-full overflow-hidden bg-primary/8 ${activeCard === 1 ? "opacity-100" : "opacity-0"}`}
              >
                <div
                  className="h-0.5 animate-[progressBar_7s_linear_forwards] bg-primary will-change-transform"
                  key={
                    activeCard === 1
                      ? animationKey
                      : `inactive-1-${animationKey}`
                  }
                />
              </div>
              <div className="flex w-full flex-col gap-2 px-6 py-5">
                <div className="flex flex-col justify-center self-stretch font-sans font-semibold text-foreground text-sm leading-6">
                  Draft blog posts from features
                </div>
                <div className="self-stretch whitespace-pre-line font-normal font-sans text-[13px] text-muted-foreground leading-[22px]">
                  Ship a feature and Notra writes the first
                  {"\n"}
                  draft of the announcement post.
                </div>
              </div>
            </button>

            <button
              className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden border border-[rgba(2,6,23,0.08)] transition-all duration-300 ${
                activeCard === 2 ? "border-border bg-white" : ""
              }`}
              onClick={() => handleCardClick(2)}
              type="button"
            >
              <div
                className={`h-0.5 w-full overflow-hidden bg-primary/8 ${activeCard === 2 ? "opacity-100" : "opacity-0"}`}
              >
                <div
                  className="h-0.5 animate-[progressBar_7s_linear_forwards] bg-primary will-change-transform"
                  key={
                    activeCard === 2
                      ? animationKey
                      : `inactive-2-${animationKey}`
                  }
                />
              </div>
              <div className="flex w-full flex-col gap-2 px-6 py-5">
                <div className="flex flex-col justify-center self-stretch font-sans font-semibold text-foreground text-sm leading-6">
                  Social updates from milestones
                </div>
                <div className="self-stretch whitespace-pre-line font-normal font-sans text-[13px] text-muted-foreground leading-[22px]">
                  Releases and milestones become short social
                  {"\n"}
                  posts you can review, tweak, and publish.
                </div>
              </div>
            </button>
          </div>

          <div className="order-1 flex w-full flex-col items-center justify-center gap-2 px-0 md:order-2 md:w-auto md:px-0">
            <div className="flex h-[250px] w-full flex-col items-start justify-start overflow-hidden border border-border bg-card md:h-[420px] md:w-[580px]">
              {activeCard === 0 ? (
                <div className="relative h-full w-full bg-card">
                  <div className="h-full overflow-hidden">
                    <article className="prose prose-stone prose-sm dark:prose-invert h-full max-w-none overflow-hidden px-5 py-4 md:px-6 md:py-5">
                      <p>
                        This week focused on changelog quality, editor polish,
                        and smoother onboarding. We added configurable lookback
                        windows, improved markdown editing reliability, and
                        shipped a progress-aware setup checklist.
                      </p>

                      <h3>
                        Configurable lookback windows for scheduled changelogs
                      </h3>
                      <p>
                        Schedules now support five predefined time ranges
                        (current day, yesterday, last 7/14/30 days) instead of
                        hardcoded 7-day windows. The selected range flows
                        through the entire generation pipeline and appears in
                        stored metadata, so you can see exactly which window
                        produced each post.
                      </p>

                      <h3>Full table support in the rich-text editor</h3>
                      <p>
                        The Lexical editor can now insert, edit, and manipulate
                        tables with a /table slash command and floating action
                        menu. Markdown roundtripping preserves table syntax
                        across view switches, and editor normalization prevents
                        false-positive dirty states on initial load.
                      </p>

                      <h3>Database-backed onboarding checklist</h3>
                      <p>
                        A collapsible checklist in the sidebar footer tracks
                        brand identity, integration, and schedule setup.
                        Progress is synced across all mutation flows, completion
                        auto-hides the widget, and collapse state persists via
                        localStorage to reduce visual noise.
                      </p>

                      <h3>Modular tone-specific changelog prompts</h3>
                      <p>
                        Changelog generation moved from a shared base prompt to
                        self-contained, one-file-per-tone templates. This
                        simplifies backend selection logic, hardens tool input
                        validation, and centralizes tone profile resolution
                        through Zod schemas.
                      </p>

                      <h3>
                        Point-in-time source metadata on generated content
                      </h3>
                      <p>
                        Each post now stores a JSONB snapshot of its trigger,
                        repositories, and lookback window. The content detail
                        page displays this metadata with Zod validation and
                        tooltip formatting for multi-repo scenarios.
                      </p>
                    </article>
                  </div>
                  <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-20 bg-linear-to-t from-white via-white/95 to-transparent" />
                </div>
              ) : (
                <div className="relative flex h-full w-full items-center justify-center">
                  <Image
                    alt=""
                    className="object-cover object-top blur-[3px]"
                    fill
                    placeholder="blur"
                    src={activeCard === 1 ? logsPreview : automationPreview}
                  />
                  <span className="relative z-10 font-medium font-sans text-muted-foreground text-sm">
                    Coming soon
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
