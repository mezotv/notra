import type { GeminiMessageRole } from "@notra/ui/components/brainless/gemini/gemini-message";

export interface GeminiStoryMessage {
  id: string;
  from: GeminiMessageRole;
  text: string;
  search?: boolean;
}
