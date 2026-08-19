import type {
  ClaudeEffort,
  ClaudeMode,
} from "@notra/ui/components/brainless/claude/claude-prompt";
import type { ClaudeTodo } from "@notra/ui/components/brainless/claude/claude-todo-list";
import type { ClaudeToolCallStatus } from "@notra/ui/components/brainless/claude/claude-tool-call";

export interface ClaudeStoryHeader {
  version: string;
  user: string;
  model: string;
  org: string;
  cwd: string;
  tips: string[];
  whatsNew: string[];
}

export interface ClaudeStoryToolCall {
  id: string;
  tool: string;
  arg?: string;
  result: string;
  status?: ClaudeToolCallStatus;
  detail?: string;
}

export interface ClaudeStorySession {
  title: string;
  header: ClaudeStoryHeader;
  userMessage: string;
  assistantMessage: string;
  todos: ClaudeTodo[];
  toolCalls: ClaudeStoryToolCall[];
  resultMessage: string;
  promptPlaceholder: string;
}

export interface ClaudeStoryPromptVariant {
  id: string;
  mode: ClaudeMode;
  effort: ClaudeEffort | false;
}
