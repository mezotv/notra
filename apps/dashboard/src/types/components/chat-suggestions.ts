import type { IconSvgElement } from "@hugeicons/react";

export interface ChatSuggestion {
  title: string;
  description: string;
  prompt: string;
  icon: IconSvgElement;
}

export interface ChatSuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  hidden?: boolean;
}

export interface SuggestionCardProps {
  suggestion: ChatSuggestion;
  disabled?: boolean;
  hidden: boolean;
  onSelect: (prompt: string) => void;
}
