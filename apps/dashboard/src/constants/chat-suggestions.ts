import {
  Blockchain04Icon,
  News01Icon,
  Sent02Icon,
} from "@hugeicons/core-free-icons";

import type { ChatSuggestion } from "@/types/components/chat-suggestions";

export const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    title: "Write a blog post",
    description: "Turn a topic into a well-scoped article",
    prompt:
      "Help me write a blog post. Ask me 1-2 questions about the topic and audience before drafting.",
    icon: News01Icon,
  },
  {
    title: "Draft release notes",
    description: "Summarize what shipped and why it matters",
    prompt:
      "Help me draft a changelog. Ask me what changed and which release or repo to reference.",
    icon: Blockchain04Icon,
  },
  {
    title: "Write a social post",
    description: "Draft a Twitter or LinkedIn update",
    prompt:
      "Help me write a social post. Ask me whether it's for Twitter or LinkedIn, then the topic and angle before drafting.",
    icon: Sent02Icon,
  },
];
