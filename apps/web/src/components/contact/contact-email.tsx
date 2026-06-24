"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useState } from "react";
import { CONTACT_PURPOSE, CONTACT_RECIPIENT } from "@/constants/contact";
import { copyToClipboard } from "@/utils/copy-to-clipboard";

const COPIED_RESET_MS = 2000;

export function ContactEmail() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const didCopy = await copyToClipboard(
      CONTACT_RECIPIENT,
      "Email address copied"
    );

    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <a
          className="font-medium font-sans text-foreground text-lg transition-colors hover:text-primary"
          href={`mailto:${CONTACT_RECIPIENT}`}
        >
          {CONTACT_RECIPIENT}
        </a>
        <p className="font-normal font-sans text-muted-foreground text-sm leading-6">
          {CONTACT_PURPOSE}
        </p>
      </div>
      <Button
        aria-label="Copy email address"
        className="shrink-0 gap-2 sm:self-start"
        onClick={handleCopy}
        size="sm"
        type="button"
        variant="outline"
      >
        <HugeiconsIcon
          className="size-4"
          icon={copied ? Tick02Icon : Copy01Icon}
          strokeWidth={2}
        />
        <span className="font-medium font-sans text-sm">
          {copied ? "Copied" : "Copy"}
        </span>
      </Button>
    </div>
  );
}
