import type { CodexExecStatus } from "@notra/ui/components/brainless/codex/codex-exec";

export interface CodexStoryHeader {
  version: string;
  model: string;
  cwd: string;
}

export interface CodexStoryExec {
  id: string;
  command: string;
  output?: string;
  status?: CodexExecStatus;
}

export interface CodexStorySession {
  title: string;
  header: CodexStoryHeader;
  userMessage: string;
  assistantMessage: string;
  execs: CodexStoryExec[];
  resultMessage: string;
  promptPlaceholder: string;
  context: string;
}
