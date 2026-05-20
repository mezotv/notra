export interface Suggestion {
  title: string;
  prompt: string;
}

export interface ChatSuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
  hidden?: boolean;
}
