"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CHAT_SUGGESTIONS } from "@/constants/chat-suggestions";
import { localStorageKeys } from "@/constants/storage";
import type {
  ChatSuggestionsProps,
  SuggestionCardProps,
} from "@/types/components/chat-suggestions";

function readSuggestionsDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(localStorageKeys.chatSuggestionsDismissed) ===
      "1"
    );
  } catch {
    return false;
  }
}

function persistSuggestionsDismissed(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(localStorageKeys.chatSuggestionsDismissed, "1");
  } catch {
    // Ignore quota exceeded and other storage errors.
  }
}

function SuggestionCard({
  suggestion,
  disabled,
  hidden,
  onSelect,
}: SuggestionCardProps) {
  return (
    <button
      className="bg-muted/70 hover:bg-muted disabled:hover:bg-muted/70 flex h-full w-full cursor-pointer flex-col items-start gap-2 rounded-xl px-3.5 py-3 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || hidden}
      onClick={() => onSelect(suggestion.prompt)}
      tabIndex={hidden ? -1 : undefined}
      type="button"
    >
      <HugeiconsIcon
        className="text-muted-foreground size-4"
        icon={suggestion.icon}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium tracking-tight">
          {suggestion.title}
        </span>
        <span className="text-muted-foreground text-xs leading-snug">
          {suggestion.description}
        </span>
      </span>
    </button>
  );
}

export function ChatSuggestions({
  onSelect,
  disabled,
  hidden = false,
}: ChatSuggestionsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (readSuggestionsDismissed()) {
      setDismissed(true);
    }
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <motion.section
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: hidden ? 0 : 1, y: hidden ? -2 : 0 }
      }
      aria-hidden={hidden}
      aria-label="Example prompts"
      className="flex w-full flex-col gap-2"
      initial={false}
      style={{ pointerEvents: hidden ? "none" : undefined }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Get started with some examples
        </p>
        <Button
          aria-label="Dismiss examples"
          disabled={disabled || hidden}
          onClick={() => {
            persistSuggestionsDismissed();
            setDismissed(true);
          }}
          size="icon-xs"
          tabIndex={hidden ? -1 : undefined}
          variant="ghost"
        >
          <HugeiconsIcon
            className="text-muted-foreground size-3.5"
            icon={Cancel01Icon}
          />
        </Button>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {CHAT_SUGGESTIONS.map((suggestion, index) => (
          <motion.li
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            className="min-w-0"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
            key={suggestion.title}
            transition={{
              duration: 0.35,
              delay: 0.05 + index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <SuggestionCard
              disabled={disabled}
              hidden={hidden}
              onSelect={onSelect}
              suggestion={suggestion}
            />
          </motion.li>
        ))}
      </ul>
    </motion.section>
  );
}
