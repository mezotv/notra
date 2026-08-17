import type {
  CodexStoryExec,
  CodexStorySession,
} from "@/types/design-system-codex";

export const CODEX_STORY_SESSION: CodexStorySession = {
  title: "codex — ~/acme/web",
  header: {
    version: "0.92.0",
    model: "gpt-5.4-codex",
    cwd: "~/acme/web",
  },
  userMessage: "draft a changelog from this week's merged PRs and post it",
  assistantMessage:
    "I'll list the week's events, draft the changelog in brand voice, then publish.",
  execs: [
    {
      id: "list-events",
      command: "notra list_events --range week",
      output: "14 merged PRs, 2 releases",
      status: "ran",
    },
    {
      id: "create-post",
      command: "notra create_post --type changelog",
      output: '"Scheduler v2, 40% faster builds"',
      status: "ran",
    },
    {
      id: "publish-post",
      command: "notra publish_post changelog",
      output: "live at acme.com/changelog",
      status: "ran",
    },
  ],
  resultMessage: "Published. Drafted in your voice from 14 PRs in 22 seconds.",
  promptPlaceholder: "Ask Codex to do anything",
  context: "12% context used",
};

export const CODEX_STORY_EXECS: CodexStoryExec[] = [
  {
    id: "ran",
    command: "notra list_events --range week",
    output: "14 merged PRs, 2 releases",
    status: "ran",
  },
  {
    id: "running",
    command: "notra create_post --type changelog",
    output: "Drafting in brand voice…",
    status: "running",
  },
  {
    id: "failed",
    command: "notra publish_post changelog",
    output: "Publish failed · retry with /retry",
    status: "failed",
  },
];
