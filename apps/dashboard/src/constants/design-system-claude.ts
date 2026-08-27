import type {
  ClaudeEffort,
  ClaudeMode,
} from "@notra/ui/components/brainless/claude/claude-prompt";
import type { ClaudeTodo } from "@notra/ui/components/brainless/claude/claude-todo-list";

import type {
  ClaudeStoryPromptVariant,
  ClaudeStorySession,
  ClaudeStoryToolCall,
} from "@/types/design-system-claude";

export const CLAUDE_STORY_MODES: ClaudeMode[] = [
  "auto",
  "manual",
  "accept-edits",
  "plan",
  "bypass",
];

export const CLAUDE_STORY_EFFORTS: ClaudeEffort[] = [
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
  "ultracode",
];

export const CLAUDE_STORY_SESSION: ClaudeStorySession = {
  title: "claude — ~/acme/web",
  header: {
    version: "v2.1.206",
    user: "Dominik",
    model: "Fable 5 with xhigh effort · Claude Max",
    org: "dominik@usenotra.com's Organization",
    cwd: "~/acme/web",
    tips: [
      "Ask Claude to draft this week's changelog",
      "Shift+Tab cycles permission mode",
    ],
    whatsNew: [
      "MCP tool calls now stream progress",
      "Added a /doctor check that proposes trims",
    ],
  },
  userMessage: "draft a changelog from this week's merged PRs and post it",
  assistantMessage:
    "I'll pull the week from notra, draft it in your voice, then publish.",
  todos: [
    { label: "Pull this week's merged PRs via notra", status: "done" },
    { label: "Draft the changelog in brand voice", status: "active" },
    { label: "Publish and schedule social updates", status: "todo" },
  ],
  toolCalls: [
    {
      id: "list-events",
      tool: "notra · list_events",
      arg: "week",
      result: "14 merged PRs, 2 releases",
    },
    {
      id: "create-post",
      tool: "notra · create_post",
      arg: "changelog",
      result: '"Scheduler v2, 40% faster builds"',
    },
    {
      id: "publish-post",
      tool: "notra · publish_post",
      arg: "changelog",
      result: "live at acme.com/changelog",
    },
  ],
  resultMessage: "Published. Drafted in your voice from 14 PRs in 22 seconds.",
  promptPlaceholder: 'Try "draft a launch post for the new API"',
};

export const CLAUDE_STORY_TODO_STATES: ClaudeTodo[] = [
  { label: "Read the brand voice from notra", status: "done" },
  { label: "Draft the LinkedIn post", status: "active" },
  { label: "Queue the X thread", status: "todo" },
];

export const CLAUDE_STORY_TOOL_STATUSES: ClaudeStoryToolCall[] = [
  {
    id: "success",
    tool: "notra · list_events",
    arg: "week",
    result: "14 merged PRs, 2 releases",
    status: "success",
  },
  {
    id: "pending",
    tool: "notra · create_post",
    arg: "changelog",
    result: "Drafting in brand voice…",
    status: "pending",
  },
  {
    id: "error",
    tool: "notra · publish_post",
    arg: "changelog",
    result: "Publish failed · retry with /retry",
    status: "error",
  },
  {
    id: "expandable",
    tool: "Read",
    arg: "apps/web/src/constants/mcp.ts",
    result: "Read 151 lines",
    status: "success",
    detail:
      'export const MCP_TERMINAL_TITLE = "claude — ~/acme/web";\nexport const MCP_TERMINAL_USER_MESSAGE =\n  "draft a changelog from this week\'s merged PRs and post it";',
  },
];

export const CLAUDE_STORY_PROMPT_MODES: ClaudeStoryPromptVariant[] =
  CLAUDE_STORY_MODES.map((mode) => ({
    id: `mode-${mode}`,
    mode,
    effort: false,
  }));

export const CLAUDE_STORY_PROMPT_EFFORTS: ClaudeStoryPromptVariant[] =
  CLAUDE_STORY_EFFORTS.map((effort) => ({
    id: `effort-${effort}`,
    mode: "auto",
    effort,
  }));
