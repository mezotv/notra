"use client";

import { ArrowDown01Icon, CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shimmer } from "@notra/ui/components/ai-elements/shimmer";
import { cn } from "cnfast";
import { domAnimation, LazyMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  getMcpFaviconUrl,
  getPreviewToolLabel,
} from "@/lib/integrations/chat-preview";
import type {
  ToolChatPreviewIconProps,
  ToolChatPreviewProps,
} from "@/types/integrations";

function ToolIcon({ candidates, className }: ToolChatPreviewIconProps) {
  const [failedCount, setFailedCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const src = candidates[failedCount];

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) {
      setFailedCount((count) => count + 1);
    }
  }, []);

  if (!src) {
    return (
      <span
        className={cn(
          "text-muted-foreground inline-flex size-4 shrink-0 items-center justify-center",
          className
        )}
      >
        <HugeiconsIcon className="size-3" icon={CpuIcon} />
      </span>
    );
  }

  return (
    <Image
      alt=""
      aria-hidden
      className={cn(
        "inline-flex size-4 shrink-0 rounded-sm object-cover",
        className
      )}
      height={16}
      onError={() => setFailedCount((count) => count + 1)}
      ref={imgRef}
      src={src}
      unoptimized
      width={16}
    />
  );
}

export function ToolChatPreview({
  logoDarkUrl,
  logoLightUrl,
  past,
  present,
  serverName,
  serverUrl,
  toolName,
}: ToolChatPreviewProps) {
  const label = getPreviewToolLabel(serverName, toolName);
  const runningText = present.trim() || `Calling ${label}`;
  const doneText = past.trim() || `Called ${label}`;
  const faviconUrl = getMcpFaviconUrl(serverUrl);
  const serverCandidates = faviconUrl ? [faviconUrl] : [];
  const lightLogo = logoLightUrl || logoDarkUrl || null;
  const darkLogo = logoDarkUrl || logoLightUrl || null;
  const lightCandidates = lightLogo
    ? [lightLogo, ...serverCandidates]
    : serverCandidates;
  const darkCandidates = darkLogo
    ? [darkLogo, ...serverCandidates]
    : serverCandidates;
  const themed = lightCandidates[0] !== darkCandidates[0];

  const icon = themed ? (
    <>
      <ToolIcon
        candidates={lightCandidates}
        className="dark:hidden"
        key={`light-${lightCandidates.join()}`}
      />
      <ToolIcon
        candidates={darkCandidates}
        className="hidden dark:inline-flex"
        key={`dark-${darkCandidates.join()}`}
      />
    </>
  ) : (
    <ToolIcon candidates={lightCandidates} key={lightCandidates.join()} />
  );

  return (
    <div className="bg-muted/40 grid gap-2 rounded-lg p-3">
      <p className="text-muted-foreground/70 text-[0.65rem] font-medium tracking-wider uppercase">
        In chat
      </p>
      <LazyMotion features={domAnimation}>
        <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
          {icon}
          <Shimmer
            as="span"
            className="min-w-0 truncate text-sm leading-5"
            duration={1.8}
          >
            {runningText}
          </Shimmer>
        </div>
      </LazyMotion>
      <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
        {icon}
        <span className="inline-block min-w-0 truncate leading-5">
          {doneText}
        </span>
        <HugeiconsIcon
          aria-hidden
          className="text-muted-foreground/60 size-3.5 shrink-0"
          icon={ArrowDown01Icon}
        />
      </div>
    </div>
  );
}
