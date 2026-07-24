"use client";

import { Download04Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { cn } from "@notra/ui/lib/utils";
import { Player } from "@remotion/player";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { parseRepoInput } from "@/lib/star-video/parse-repo";
import {
  DEFAULT_BACKGROUND_COLOR,
  VIDEO_DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/remotion/star-video/constants";
import { StarVideo } from "@/remotion/star-video/star-video";
import type { RepoStarData, StarVideoInputProps } from "@/types/star-video";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(input: string): string | null {
  if (!HEX_COLOR.test(input)) {
    return null;
  }
  const hex = input.slice(1);
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();
  }
  return `#${hex}`.toLowerCase();
}

const BACKGROUND_PRESETS = [
  { value: DEFAULT_BACKGROUND_COLOR, label: "Mint" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#bcd7ff", label: "Sky" },
  { value: "#ffd6a5", label: "Amber" },
  { value: "#ffc9d6", label: "Rose" },
  { value: "#c7f0ff", label: "Ice" },
];

export function StarVideoPreview() {
  const [repoParam] = useQueryState("repo");
  const [bgParam, setBgParam] = useQueryState("bg");

  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [data, setData] = useState<RepoStarData | null>(null);
  const [backgroundColor, setBackgroundColor] = useState(
    (bgParam && normalizeHex(bgParam)) || DEFAULT_BACKGROUND_COLOR
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    const parsed = repoParam ? parseRepoInput(repoParam) : null;

    if (hasMounted.current && repoParam) {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    hasMounted.current = true;

    if (!parsed) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const response = await fetch(
          `/api/star-video/repo?owner=${encodeURIComponent(parsed.owner)}&repo=${encodeURIComponent(parsed.repo)}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const json: RepoStarData = await response.json();
          setData(json);
        } else {
          const json: { error?: string } = await response
            .json()
            .catch(() => ({}));
          setData(null);
          toast.error(json.error ?? "Could not load that repository.");
        }
      } catch {
        if (!controller.signal.aborted) {
          setData(null);
          toast.error("Something went wrong loading that repository.");
        }
      }
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [repoParam]);

  const applyBackground = useCallback(
    (color: string) => {
      const normalized = normalizeHex(color);
      if (!normalized) {
        return;
      }
      setBackgroundColor(normalized);
      setBgParam(normalized);
    },
    [setBgParam]
  );

  const inputProps = useMemo<StarVideoInputProps | null>(() => {
    if (!data) {
      return null;
    }
    return {
      owner: data.owner,
      repo: data.repo,
      stars: data.stars,
      avatars: data.avatars,
      backgroundColor,
    };
  }, [data, backgroundColor]);

  const onDownload = async () => {
    if (!inputProps) {
      return;
    }
    setIsRendering(true);
    const pending = toast.loading(
      "Rendering your video. This can take a minute."
    );
    try {
      const response = await fetch("/api/star-video/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputProps),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${inputProps.owner}-${inputProps.repo}-stars.mp4`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Video ready.", { id: pending });
      } else {
        const json: { error?: string } = await response
          .json()
          .catch(() => ({}));
        toast.error(json.error ?? "Could not render the video.", {
          id: pending,
        });
      }
    } catch {
      toast.error("Something went wrong rendering the video.", { id: pending });
    }
    setIsRendering(false);
  };

  return (
    <div
      className="flex w-full max-w-5xl scroll-mt-24 flex-col items-center gap-6 px-4 sm:px-6"
      ref={containerRef}
    >
      <div className="w-full rounded-3xl border border-[#1E1E1E14] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-2 sm:p-4 dark:border-white/10 dark:bg-none dark:bg-white/[0.02]">
        <div className="overflow-hidden rounded-2xl border border-[#1E1E1E0D] bg-background dark:border-white/5">
          {isLoading && (
            <Skeleton className="aspect-video w-full rounded-none" />
          )}

          {!isLoading && inputProps && (
            <Player
              acknowledgeRemotionLicense
              autoPlay
              className="!h-auto !w-full aspect-video"
              component={StarVideo}
              compositionHeight={VIDEO_HEIGHT}
              compositionWidth={VIDEO_WIDTH}
              controls
              durationInFrames={VIDEO_DURATION_IN_FRAMES}
              fps={VIDEO_FPS}
              initiallyMuted
              inputProps={inputProps}
              key={`${data?.id}-${backgroundColor}`}
              loop
            />
          )}

          {!(isLoading || inputProps) && (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 text-center">
              <HugeiconsIcon
                className="size-7 text-[#1E1E1E4D] dark:text-white/30"
                icon={StarIcon}
              />
              <p className="max-w-xs font-sans text-[#1E1E1E99] text-sm dark:text-white/50">
                Enter a repository above to render its star celebration.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <span className="font-sans text-[#1E1E1E99] text-sm dark:text-white/50">
            Background
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {BACKGROUND_PRESETS.map((preset) => (
              <button
                aria-label={preset.label}
                aria-pressed={backgroundColor === preset.value}
                className={cn(
                  "size-7 rounded-full border transition-transform hover:scale-110",
                  backgroundColor === preset.value
                    ? "border-[#1E1E1E] ring-2 ring-[#1E1E1E1A] dark:border-white dark:ring-white/20"
                    : "border-[#1E1E1E1A] dark:border-white/15"
                )}
                key={preset.value}
                onClick={() => applyBackground(preset.value)}
                style={{ backgroundColor: preset.value }}
                type="button"
              />
            ))}
            <label
              className="flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#1E1E1E1A] dark:border-white/15"
              htmlFor="star-video-bg"
              style={{ backgroundColor }}
            >
              <input
                aria-label="Custom background color"
                className="sr-only"
                id="star-video-bg"
                onChange={(event) => applyBackground(event.target.value)}
                type="color"
                value={backgroundColor}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end">
          <CtaButton
            className="h-12 rounded-2xl px-6 font-display font-medium text-[1.0625rem] tracking-[-0.015em]"
            disabled={!inputProps || isRendering}
            onClick={onDownload}
            variant="light"
          >
            <HugeiconsIcon className="size-4" icon={Download04Icon} />
            {isRendering ? "Rendering" : "Download MP4"}
          </CtaButton>
          {inputProps ? (
            <p className="font-sans text-[#1E1E1E99] text-xs dark:text-white/50">
              {inputProps.stars.toLocaleString()} stars · {inputProps.owner}/
              {inputProps.repo}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
