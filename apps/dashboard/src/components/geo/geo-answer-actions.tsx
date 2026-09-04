"use client";

import { ArrowUpRight01Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GEO_PROMPT_ANSWER_COPIED_MESSAGE,
  GEO_PROMPT_ANSWER_COPY_LABEL,
  GEO_PROMPT_RECEIPT_LABELS,
} from "@notra/geo-core/constants/geo";

import { Button } from "@/components/button";
import type { GeoAnswerActionsProps } from "@/types/geo";
import { copyTextToClipboard } from "@/utils/copy-to-clipboard";
import { getSafeReferenceSourceUrl } from "@/utils/reference-source-url";

export function GeoAnswerActions({ text, sources }: GeoAnswerActionsProps) {
  const links = sources.flatMap((source) => {
    const href = getSafeReferenceSourceUrl(source.url);
    return href ? [{ href, domain: source.domain, title: source.title }] : [];
  });

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <Button
        aria-label={GEO_PROMPT_ANSWER_COPY_LABEL}
        className="text-muted-foreground h-7 gap-1.5 px-2"
        onClick={() =>
          copyTextToClipboard(text, GEO_PROMPT_ANSWER_COPIED_MESSAGE)
        }
        size="sm"
        type="button"
        variant="ghost"
      >
        <HugeiconsIcon aria-hidden="true" icon={Copy01Icon} size={14} />
        {GEO_PROMPT_ANSWER_COPY_LABEL}
      </Button>
      {links.length > 0 ? (
        <ul
          aria-label={GEO_PROMPT_RECEIPT_LABELS.openSources}
          className="flex flex-wrap items-center gap-1.5"
        >
          {links.map((link) => (
            <li key={link.href}>
              <a
                aria-label={`Open ${link.title} on ${link.domain}`}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs outline-none focus-visible:ring-2"
                href={link.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="max-w-[10rem] truncate">{link.domain}</span>
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowUpRight01Icon}
                  size={12}
                />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
