"use client";

import type { ContentType } from "@notra/ai/schemas/content";
import { OutputTypeIcon } from "@/utils/output-types";

interface Suggestion {
  outputType: ContentType;
  label: string;
  prompt: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    outputType: "blog_post",
    label: "Write a blog post",
    prompt:
      "Help me write a blog post. Ask me 1-2 questions about the topic and audience before drafting.",
  },
  {
    outputType: "changelog",
    label: "Draft a changelog",
    prompt:
      "Help me draft a changelog. Ask me what changed and which release or repo to reference.",
  },
  {
    outputType: "twitter_post",
    label: "Post on Twitter",
    prompt:
      "Help me write a Twitter post. Ask me about the topic and angle before drafting.",
  },
  {
    outputType: "linkedin_post",
    label: "Post on LinkedIn",
    prompt:
      "Help me write a LinkedIn post. Ask me about the topic and audience before drafting.",
  },
];

interface ChatSuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function ChatSuggestions({ onSelect, disabled }: ChatSuggestionsProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
      {SUGGESTIONS.map((suggestion) => (
        <button
          className="flex cursor-pointer flex-col items-start gap-2 rounded-[14px] border bg-background p-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          key={suggestion.outputType}
          onClick={() => onSelect(suggestion.prompt)}
          type="button"
        >
          <OutputTypeIcon
            className="size-4 text-muted-foreground"
            outputType={suggestion.outputType}
          />
          <span className="font-medium text-sm">{suggestion.label}</span>
        </button>
      ))}
    </div>
  );
}
