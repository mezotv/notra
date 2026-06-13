"use client";

import { useEffect, useRef, useState } from "react";
import type { LoopVideoProps } from "@/lib/marketing-assets/types";

export function LoopVideo({ src, poster, label }: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<
    boolean | null
  >(null);
  const shouldAutoplay = prefersReducedMotion === false;

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
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!shouldAutoplay) {
      video.pause();
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    const play = () => {
      video.play().catch(() => undefined);
    };
    play();
    video.addEventListener("canplay", play);
    return () => {
      video.removeEventListener("canplay", play);
    };
  }, [shouldAutoplay]);

  return (
    <video
      aria-label={label}
      autoPlay={shouldAutoplay}
      className="block w-full rounded-2xl border border-border/60 shadow-[0_2.5rem_5rem_-2.5rem_rgb(0_0_0/0.45)]"
      loop={shouldAutoplay}
      muted
      playsInline
      poster={poster}
      preload="metadata"
      ref={videoRef}
      src={src}
    />
  );
}
