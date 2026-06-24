"use client";

import {
  ArrowDataTransferHorizontalIcon,
  Cancel01Icon,
  Image02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { computeImageSimilarity } from "./similarity";

interface SelectedImage {
  url: string;
  name: string;
}

interface SimilarityResult {
  key: string;
  value: number | null;
}

type Side = "before" | "after";

const DEFAULT_POSITION = 50;
const FULL = 100;

function ImageSlot({
  side,
  image,
  onSelect,
  onClear,
}: {
  side: Side;
  image: SelectedImage | null;
  onSelect: (side: Side, file: File) => void;
  onClear: (side: Side) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = side === "before" ? "Before" : "After";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{label}</span>
        {image && (
          <Button
            aria-label={`Remove ${label} image`}
            className="h-7 px-2 text-muted-foreground"
            onClick={() => onClear(side)}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
            Remove
          </Button>
        )}
      </div>
      <input
        accept="image/png,image/jpeg,image/webp"
        aria-label={`Upload ${label} image`}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onSelect(side, file);
          }
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <button
        aria-label={image ? `Change ${label} image` : `Upload ${label} image`}
        className={cn(
          "flex h-40 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-card transition-colors hover:border-foreground/30 hover:bg-accent/40",
          image && "border-solid"
        )}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {image ? (
          <span className="relative size-full">
            <Image
              alt={image.name}
              className="object-contain"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              src={image.url}
              unoptimized
            />
          </span>
        ) : (
          <>
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Image02Icon}
              size={22}
            />
            <span className="font-medium text-sm">Upload {label} image</span>
            <span className="text-muted-foreground text-xs">
              PNG, JPEG or WebP
            </span>
          </>
        )}
      </button>
      {image && (
        <p
          className="truncate text-muted-foreground text-xs"
          title={image.name}
        >
          {image.name}
        </p>
      )}
    </div>
  );
}

function describeSimilarity(value: number): string {
  if (value >= 99) {
    return "Practically identical";
  }
  if (value >= 90) {
    return "Very similar";
  }
  if (value >= 70) {
    return "Fairly similar";
  }
  if (value >= 40) {
    return "Noticeably different";
  }
  return "Very different";
}

export default function PageClient() {
  const [before, setBefore] = useState<SelectedImage | null>(null);
  const [after, setAfter] = useState<SelectedImage | null>(null);
  const [similarityResult, setSimilarityResult] =
    useState<SimilarityResult | null>(null);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const comparisonKey =
    before && after ? JSON.stringify([before.url, after.url]) : null;
  const similarity =
    comparisonKey && similarityResult?.key === comparisonKey
      ? similarityResult.value
      : null;
  const isComputing =
    comparisonKey !== null && similarityResult?.key !== comparisonKey;

  function handleSelect(side: Side, file: File) {
    const url = URL.createObjectURL(file);
    const next = { url, name: file.name };
    const setter = side === "before" ? setBefore : setAfter;
    setter(next);
  }

  function handleClear(side: Side) {
    const setter = side === "before" ? setBefore : setAfter;
    setter(null);
    setSimilarityResult(null);
  }

  useEffect(() => {
    if (!(before && after)) {
      return;
    }

    const key = JSON.stringify([before.url, after.url]);
    let cancelled = false;
    computeImageSimilarity(before.url, after.url)
      .then((value) => {
        if (!cancelled) {
          setSimilarityResult({ key, value });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSimilarityResult({ key, value: null });
          toast.error("Couldn't compare those images");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [before, after]);

  useEffect(() => {
    if (!before) {
      return;
    }
    return () => {
      URL.revokeObjectURL(before.url);
    };
  }, [before]);

  useEffect(() => {
    if (!after) {
      return;
    }
    return () => {
      URL.revokeObjectURL(after.url);
    };
  }, [after]);

  function updatePosition(clientX: number) {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * FULL;
    setPosition(Math.max(0, Math.min(FULL, percent)));
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updatePosition(event.clientX);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      updatePosition(event.clientX);
    }
  };

  const stopDragging = () => {
    isDraggingRef.current = false;
  };
  const bothSelected = Boolean(before && after);

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">Image Compare</h1>
          <p className="text-muted-foreground">
            Upload two images to see how similar they are pixel-for-pixel, then
            slide between them to spot the differences.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ImageSlot
            image={before}
            onClear={handleClear}
            onSelect={handleSelect}
            side="before"
          />
          <ImageSlot
            image={after}
            onClear={handleClear}
            onSelect={handleSelect}
            side="after"
          />
        </div>

        {bothSelected && (
          <div className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <HugeiconsIcon
                  className="text-muted-foreground"
                  icon={ArrowDataTransferHorizontalIcon}
                  size={20}
                />
                <div>
                  <p className="text-muted-foreground text-xs">Similarity</p>
                  <p className="font-bold text-2xl tabular-nums">
                    {isComputing || similarity === null
                      ? "—"
                      : `${similarity.toFixed(1)}%`}
                  </p>
                </div>
              </div>
              {!isComputing && similarity !== null && (
                <span className="rounded-full bg-accent px-3 py-1 font-medium text-sm">
                  {describeSimilarity(similarity)}
                </span>
              )}
              {isComputing && (
                <span className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2Icon className="size-4 animate-spin" />
                  Comparing…
                </span>
              )}
            </div>

            <div
              className="relative h-96 w-full cursor-ew-resize select-none overflow-hidden rounded-md border bg-[length:24px_24px] bg-[repeating-conic-gradient(#0000000d_0_25%,transparent_0_50%)]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDragging}
              ref={containerRef}
            >
              {before && (
                <span
                  className="absolute inset-0 bg-center bg-contain bg-no-repeat"
                  style={{ backgroundImage: `url("${before.url}")` }}
                />
              )}
              {after && (
                <span
                  className="absolute inset-0 bg-center bg-contain bg-no-repeat"
                  style={{
                    backgroundImage: `url("${after.url}")`,
                    clipPath: `inset(0 0 0 ${position}%)`,
                  }}
                />
              )}

              <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 font-medium text-white text-xs">
                Before
              </span>
              <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 font-medium text-white text-xs">
                After
              </span>

              <span
                className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
                style={{ left: `${position}%` }}
              >
                <span className="-translate-y-1/2 -translate-x-1/2 absolute top-1/2 left-1/2 flex size-8 items-center justify-center rounded-full border bg-white text-black shadow">
                  <HugeiconsIcon
                    icon={ArrowDataTransferHorizontalIcon}
                    size={16}
                  />
                </span>
              </span>
            </div>

            <div className="space-y-1">
              <label
                className="text-muted-foreground text-xs"
                htmlFor="compare-position"
              >
                Slider position
              </label>
              <input
                className="w-full accent-foreground"
                id="compare-position"
                max={FULL}
                min={0}
                onChange={(event) => setPosition(Number(event.target.value))}
                type="range"
                value={position}
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
