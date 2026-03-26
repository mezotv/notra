"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function DocumentationSection() {
  const [activeCard, setActiveCard] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 3);
      setAnimationKey((prev) => prev + 1);
    }, 7000);
  }, []);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
            From shipped code to{" "}
            <span className="text-primary">published content</span>
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
              className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden border border-border/70 transition-all duration-300 ${
                activeCard === 0 ? "border-border bg-background" : ""
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
              className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden border border-border/70 transition-all duration-300 ${
                activeCard === 1 ? "border-border bg-background" : ""
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
              className={`flex w-full cursor-pointer flex-col items-start justify-start overflow-hidden border border-border/70 transition-all duration-300 ${
                activeCard === 2 ? "border-border bg-background" : ""
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
            <div className="flex h-[250px] w-full flex-col items-start justify-start overflow-hidden border border-border bg-background md:h-[420px] md:w-[580px]">
              {activeCard === 0 ? (
                <div className="relative h-full w-full bg-background">
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
                  <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-20 bg-linear-to-t from-background via-background/95 to-transparent" />
                </div>
              ) : activeCard === 1 ? (
                <div className="relative h-full w-full bg-background">
                  <div className="h-full overflow-hidden">
                    <article className="prose prose-stone prose-sm dark:prose-invert h-full max-w-none overflow-hidden px-5 py-4 md:px-6 md:py-5">
                      <p>
                        When we built Notra, we made one big bet: that most
                        teams would rather automate what goes to their audience
                        than hand-tweak it every time. Still true. But we missed
                        something. Not every ship deserves coverage. Not every
                        commit is worth mentioning. And automatic is not helpful
                        if the output does not sound like you.
                      </p>
                      <p>
                        This week we shipped three things that change how you
                        generate content. They come down to one idea: you decide
                        what gets made and how it sounds.
                      </p>

                      <h2>Generate what you actually want to ship</h2>
                      <p>
                        For the first two months, Notra worked like this: set up
                        a trigger, the AI looks at everything since last time,
                        drafts appear. Fine if you wanted broad coverage. Broke
                        down when you wanted to be selective.
                      </p>
                      <p>
                        So we rebuilt the generate flow. When you create content
                        on-demand now, you see a preview first. The commits,
                        PRs, and releases Notra found. You check boxes for what
                        belongs in your story. Toggle releases on or off. Pick a
                        time window. Scope to specific repos.
                      </p>

                      <h2>Your voice, not a generic one</h2>
                      <p>
                        The other gap we kept hearing: content that looked good
                        but sounded like nobody. Teams would edit our drafts
                        because the tone felt off. Not wrong. Just not theirs.
                      </p>
                      <p>
                        This week we shipped brand voice learning. Add
                        references from your Twitter account (or paste custom
                        text), and Notra's agents study them first, before
                        generating anything.
                      </p>
                    </article>
                  </div>
                  <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-20 bg-linear-to-t from-background via-background/95 to-transparent" />
                </div>
              ) : (
                <div className="relative h-full w-full bg-background">
                  <div className="flex h-full flex-col gap-4 overflow-hidden px-5 py-4 md:px-6 md:py-5">
                    <div className="flex flex-col gap-3 rounded-xl border p-4">
                      <div className="flex items-center gap-2.5">
                        <Image
                          alt="Notra"
                          className="size-10 shrink-0 rounded-full"
                          height={40}
                          src="/notra-mark.svg"
                          width={40}
                        />
                        <div>
                          <p className="font-semibold text-sm">Notra</p>
                          <p className="text-muted-foreground text-xs">
                            2,400 followers · 1h
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-[0.8125rem] leading-relaxed">
                        <p>Built on-demand content generation flow.</p>
                        <p>Actually built it over the last week. Major ship.</p>
                        <p>
                          The problem our users kept asking for: they want
                          content generated right now. Not scheduled, not
                          waiting for the next webhook. Just a quick button
                          press and a preview.
                        </p>
                        <p>
                          We shipped:
                          <br />- Configurable data sources (choose which repos,
                          which commits, which releases)
                          <br />- Live preview before generating
                        </p>
                      </div>
                      <div className="flex items-center gap-4 border-t pt-3 text-muted-foreground text-xs">
                        <span>42 likes</span>
                        <span>8 comments</span>
                        <span>3 reposts</span>
                      </div>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-background via-background/80 to-transparent" />
                  <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-28 bg-linear-to-t from-background via-background/95 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
