"use client";

import { useEffect, useRef } from "react";
import type { LoopVideoProps } from "@/types/marketing-assets";

export function LoopVideo({ src, poster, label }: LoopVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
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
  }, []);

  return (
    <video
      aria-label={label}
      autoPlay
      className="block w-full rounded-2xl border border-border/60 shadow-[0_2.5rem_5rem_-2.5rem_rgb(0_0_0/0.45)]"
      loop
      muted
      playsInline
      poster={poster}
      preload="auto"
      ref={videoRef}
      src={src}
    />
  );
}
