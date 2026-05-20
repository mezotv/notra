"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "motion/react";
import type {
  ChatSuggestionsProps,
  Suggestion,
} from "@/types/components/chat-suggestions";

const SUGGESTIONS: Suggestion[] = [
  {
    title: "Blog article",
    prompt:
      "Help me write a blog post. Ask me 1-2 questions about the topic and audience before drafting.",
  },
  {
    title: "Release notes",
    prompt:
      "Help me draft a changelog. Ask me what changed and which release or repo to reference.",
  },
  {
    title: "Tweet",
    prompt:
      "Help me write a Twitter post. Ask me about the topic and angle before drafting.",
  },
  {
    title: "LinkedIn post",
    prompt:
      "Help me write a LinkedIn post. Ask me about the topic and audience before drafting.",
  },
];

export function ChatSuggestions({
  onSelect,
  disabled,
  hidden = false,
}: ChatSuggestionsProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.ul
      animate={
        shouldReduceMotion
          ? undefined
          : { opacity: hidden ? 0 : 1, y: hidden ? -2 : 0 }
      }
      aria-hidden={hidden}
      className="w-full divide-y divide-border border-y"
      initial={false}
      style={{ pointerEvents: hidden ? "none" : undefined }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {SUGGESTIONS.map((suggestion, index) => (
        <motion.li
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
          key={suggestion.title}
          transition={{
            duration: 0.35,
            delay: 0.05 + index * 0.05,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <button
            className="group flex w-full cursor-pointer items-center gap-[1rem] px-[0.25rem] py-[0.75rem] text-left transition-colors duration-200 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            disabled={disabled || hidden}
            onClick={() => onSelect(suggestion.prompt)}
            tabIndex={hidden ? -1 : undefined}
            type="button"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-[0.125rem]">
              <span className="font-medium text-[0.9375rem] text-foreground/90 tracking-tight transition-colors group-hover:text-foreground">
                {suggestion.title}
              </span>
              <span className="truncate text-[0.8125rem] text-muted-foreground leading-snug">
                {suggestion.prompt}
              </span>
            </span>
            <HugeiconsIcon
              className="size-[0.875rem] shrink-0 translate-x-[-0.375rem] text-muted-foreground/0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:text-muted-foreground"
              icon={ArrowRight01Icon}
            />
          </button>
        </motion.li>
      ))}
    </motion.ul>
  );
}
