"use client";

import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { cn } from "@notra/ui/lib/utils";

const displacementMapCache = new Map<string, string>();

function getDisplacementMapCacheKey(size: number, bezel: number) {
  return `${size}:${bezel}`;
}

export type LiquidGlassProps = HTMLAttributes<HTMLDivElement> & {
  blur?: number;
  refraction?: number;
  mapSize?: number;
  bezel?: number;
};

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  function LiquidGlass(
    {
      blur = 2,
      refraction = 15,
      mapSize = 320,
      bezel = 0.34,
      className,
      style,
      children,
      ...props
    },
    ref
  ) {
    const rawId = useId();
    const filterId = useMemo(
      () => `liquid-glass-${rawId.replace(/:/g, "")}`,
      [rawId]
    );
    const [mapUrl, setMapUrl] = useState(() => {
      if (typeof document === "undefined") {
        return "";
      }

      return displacementMapCache.get(
        getDisplacementMapCacheKey(mapSize, bezel)
      ) ?? "";
    });

    useEffect(() => {
      const nextMapUrl = createDisplacementMap(mapSize, bezel);
      setMapUrl((currentMapUrl) =>
        currentMapUrl === nextMapUrl ? currentMapUrl : nextMapUrl
      );
    }, [bezel, mapSize]);

    return (
      <>
        <div
          className={cn(
            "relative overflow-hidden rounded-full border border-black/10 bg-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.5),inset_0_-1px_0_0_rgba(0,0,0,0.05)] dark:border-white/20 dark:shadow-[0_18px_60px_rgba(0,0,0,0.36),inset_0_0_0_1px_rgba(255,255,255,0.035),inset_-9px_-7px_18px_rgba(0,0,0,0.48)]",
            className
          )}
          ref={ref}
          style={
            {
              ...style,
              backdropFilter: `url(#${filterId}) blur(${blur}px) saturate(1.28)`,
              WebkitBackdropFilter: `url(#${filterId}) blur(${blur}px) saturate(1.28)`,
            } as CSSProperties
          }
          {...props}
        >
          {children}
        </div>

        <svg aria-hidden className="absolute size-0 overflow-hidden">
          <filter
            colorInterpolationFilters="sRGB"
            height="100%"
            id={filterId}
            width="100%"
            x="0"
            y="0"
          >
            {mapUrl ? (
              <feImage
                height="100%"
                href={mapUrl}
                preserveAspectRatio="none"
                result="displacementMap"
                width="100%"
                x="0"
                y="0"
              />
            ) : null}
            <feDisplacementMap
              in="SourceGraphic"
              in2="displacementMap"
              result="displaced"
              scale={refraction}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur in="displaced" stdDeviation="0.15" />
          </filter>
        </svg>
      </>
    );
  }
);

function createDisplacementMap(size: number, bezel: number) {
  const cacheKey = getDisplacementMapCacheKey(size, bezel);
  const cachedMap = displacementMapCache.get(cacheKey);

  if (cachedMap !== undefined) {
    return cachedMap;
  }

  const canvas = document.createElement("canvas");
  canvas.height = size;
  canvas.width = size;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return "";
  }

  const image = ctx.createImageData(size, size);
  const { data } = image;
  const center = (size - 1) / 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x - center) / center;
      const ny = (y - center) / center;
      const radius = Math.hypot(nx, ny);
      const index = (y * size + x) * 4;

      if (radius > 1) {
        data[index] = 128;
        data[index + 1] = 128;
        data[index + 2] = 128;
        data[index + 3] = 255;
        continue;
      }

      const edgeDistance = 1 - radius;
      const bezelT = clamp(edgeDistance / bezel, 0, 1);
      const surface = convexSquircle(bezelT);
      const fadeToCenter = 1 - smootherstep(0.55, 1, edgeDistance);
      const rimKick = Math.sin(bezelT * Math.PI) * 0.52;
      const magnitude =
        clamp((1 - surface) * 0.55 + rimKick, 0, 1) * fadeToCenter;
      const direction =
        radius === 0 ? { x: 0, y: 0 } : { x: nx / radius, y: ny / radius };

      data[index] = Math.round(128 + direction.x * magnitude * 127);
      data[index + 1] = Math.round(128 + direction.y * magnitude * 127);
      data[index + 2] = 128;
      data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const mapUrl = canvas.toDataURL("image/png");
  displacementMapCache.set(cacheKey, mapUrl);

  return mapUrl;
}

function convexSquircle(x: number) {
  return (1 - (1 - x) ** 4) ** 0.25;
}

function smootherstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
