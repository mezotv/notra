"use client";

import { cn } from "@notra/ui/lib/utils";
import { useEffect, useState } from "react";
import type { AssetHeroVideo } from "@/lib/marketing-assets/types/hero";
import { LoopVideo } from "./loop-video";

const SLIDE_DURATION_MS = 5000;
const PROGRESS_INTERVAL_MS = 50;

interface HeroVideoCarouselProps {
  videos: [AssetHeroVideo, ...AssetHeroVideo[]];
  className?: string;
}

export function HeroVideoCarousel({
  videos,
  className,
}: HeroVideoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeVideo = videos[activeIndex] ?? videos[0];

  // biome-ignore lint/correctness/useExhaustiveDependencies: activeIndex intentionally restarts slide progress.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(media.matches);
    };

    updatePreference();
    media.addEventListener("change", updatePreference);

    return () => {
      media.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || videos.length < 2) {
      setProgress(100);
      return;
    }

    const startedAt = performance.now();
    setProgress(0);

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const nextProgress = Math.min((elapsed / SLIDE_DURATION_MS) * 100, 100);

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setActiveIndex((currentIndex) => (currentIndex + 1) % videos.length);
      }
    }, PROGRESS_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [activeIndex, prefersReducedMotion, videos.length]);

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="corner-squircle relative overflow-hidden rounded-2xl bg-[#C8B2EE40] supports-[corner-shape:round]:rounded-[1.25rem] dark:bg-white/[0.04]">
        <LoopVideo
          className="fade-in-0 zoom-in-95 animate-in rounded-2xl border-border/70 shadow-none duration-500 supports-[corner-shape:round]:rounded-[1.25rem] motion-reduce:animate-none"
          key={activeVideo.src}
          label={activeVideo.label}
          poster={activeVideo.poster}
          src={activeVideo.src}
        />
      </div>

      {videos.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {videos.map((video, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                aria-current={isActive ? "true" : undefined}
                aria-label={`Go to slide ${index + 1}`}
                className={cn(
                  "relative h-2 cursor-pointer rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "w-12 bg-foreground/15"
                    : "w-2 bg-foreground/20 hover:bg-foreground/40"
                )}
                key={video.src}
                onClick={() => {
                  setActiveIndex(index);
                  setProgress(0);
                }}
                type="button"
              >
                {isActive ? (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-foreground/60"
                    style={{ width: `${progress}%` }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
