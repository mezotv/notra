"use client";

import { Download04Icon, StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Player, type PlayerRef } from "@remotion/player";
import { useQueryState } from "nuqs";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const DEFAULT_INPUT = "usenotra/notra";
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
  DEFAULT_BACKGROUND_COLOR,
  "#8b5cf6",
  "#bcd7ff",
  "#ffd6a5",
  "#ffc9d6",
  "#c7f0ff",
];

export default function StarVideoTool() {
  const [repoParam, setRepoParam] = useQueryState("repo");
  const [bgParam, setBgParam] = useQueryState("bg");

  const [value, setValue] = useState(repoParam ?? DEFAULT_INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(
    (bgParam && normalizeHex(bgParam)) || DEFAULT_BACKGROUND_COLOR
  );
  const [data, setData] = useState<RepoStarData | null>(null);

  const loadRepo = useCallback(
    async (raw: string) => {
      const parsed = parseRepoInput(raw);
      if (!parsed) {
        toast.error("Enter a repo as owner/name or a GitHub URL.");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/star-video/repo?owner=${encodeURIComponent(parsed.owner)}&repo=${encodeURIComponent(parsed.repo)}`
        );
        const json: RepoStarData & { error?: string } = await response.json();
        if (!response.ok) {
          toast.error(json.error ?? "Could not load that repository.");
          return;
        }
        setData(json);
        setRepoParam(json.id);
      } catch {
        toast.error("Something went wrong loading that repository.");
      } finally {
        setIsLoading(false);
      }
    },
    [setRepoParam]
  );

  const initialLoad = useRef(false);
  useEffect(() => {
    if (initialLoad.current) {
      return;
    }
    initialLoad.current = true;
    if (repoParam) {
      loadRepo(repoParam);
    }
  }, [repoParam, loadRepo]);

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

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      loadRepo(value);
    },
    [loadRepo, value]
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

  const playerRef = useRef<PlayerRef>(null);
  useEffect(() => {
    if (inputProps) {
      playerRef.current?.seekTo(0);
      playerRef.current?.play();
    }
  }, [inputProps]);

  const onDownload = useCallback(async () => {
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
      if (!response.ok) {
        const json: { error?: string } = await response
          .json()
          .catch(() => ({}));
        toast.error(json.error ?? "Could not render the video.", {
          id: pending,
        });
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${inputProps.owner}-${inputProps.repo}-stars.mp4`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Video ready.", { id: pending });
    } catch {
      toast.error("Something went wrong rendering the video.", { id: pending });
    } finally {
      setIsRendering(false);
    }
  }, [inputProps]);

  return (
    <div className="flex w-full flex-col gap-6">
      <form
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={onSubmit}
      >
        <Input
          aria-label="GitHub repository"
          className="h-11 flex-1 text-base"
          onChange={(event) => setValue(event.target.value)}
          placeholder="owner/name or github.com/owner/name"
          value={value}
        />
        <Button className="h-11 gap-2 px-6" disabled={isLoading} type="submit">
          <HugeiconsIcon className="size-4" icon={StarIcon} />
          {isLoading ? "Loading" : "Generate video"}
        </Button>
      </form>

      <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading && <Skeleton className="aspect-video w-full rounded-none" />}

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
            ref={playerRef}
          />
        )}

        {!(isLoading || inputProps) && (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <HugeiconsIcon className="size-8" icon={StarIcon} />
            <p className="text-sm">
              Enter a repository to render its star celebration.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-muted-foreground text-sm">Background</span>
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            aria-label={`Use background ${preset}`}
            aria-pressed={
              backgroundColor.toLowerCase() === preset.toLowerCase()
            }
            className={`size-7 rounded-full border transition-transform hover:scale-110 ${
              backgroundColor.toLowerCase() === preset.toLowerCase()
                ? "border-foreground ring-2 ring-foreground/20"
                : "border-border"
            }`}
            key={preset}
            onClick={() => applyBackground(preset)}
            style={{ backgroundColor: preset }}
            type="button"
          />
        ))}
        <label
          className="flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border"
          htmlFor="bg-color-input"
          style={{ backgroundColor }}
        >
          <input
            aria-label="Custom background color"
            className="sr-only"
            id="bg-color-input"
            onChange={(event) => applyBackground(event.target.value)}
            type="color"
            value={backgroundColor}
          />
        </label>
      </div>

      {inputProps && (
        <div className="flex flex-col items-center gap-3">
          <Button
            className="h-11 gap-2 px-6"
            disabled={isRendering}
            onClick={onDownload}
            type="button"
            variant="outline"
          >
            <HugeiconsIcon
              className={`size-4 ${isRendering ? "animate-spin" : ""}`}
              icon={Download04Icon}
            />
            {isRendering ? "Rendering" : "Download MP4"}
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            Showing {inputProps.stars.toLocaleString()} stars for{" "}
            <span className="font-medium text-foreground">
              {inputProps.owner}/{inputProps.repo}
            </span>
            .
          </p>
        </div>
      )}
    </div>
  );
}
