"use client";

import { track } from "@databuddy/sdk/react";
import Link from "next/link";
import type { TrackedAiSummaryLinkProps } from "~types/ai-summary";

export function TrackedAiSummaryLink({
  name,
  slug,
  href,
  children,
}: TrackedAiSummaryLinkProps) {
  function handleClick() {
    track(`summarize_${slug}`, {
      provider: slug,
      location: "footer",
    });
  }

  return (
    <Link
      aria-label={`Summarize Notra with ${name}`}
      className="group flex items-center gap-2 text-foreground transition-colors hover:text-primary"
      href={href}
      onClick={handleClick}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </Link>
  );
}
