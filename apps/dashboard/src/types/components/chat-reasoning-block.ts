export interface ChatReasoningBlockProps {
  children: string;
  isStreaming: boolean;
}

export interface ChatReasoningBlockState {
  durationSeconds: number | null;
  isOpen: boolean;
  wasStreaming: boolean | null;
}
