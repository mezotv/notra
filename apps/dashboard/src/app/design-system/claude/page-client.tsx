"use client";

import {
  ClaudeHeader,
  ClaudeLogo,
} from "@notra/ui/components/brainless/claude/claude-header";
import { ClaudeMessage } from "@notra/ui/components/brainless/claude/claude-message";
import {
  type ClaudeEffort,
  type ClaudeMode,
  ClaudePrompt,
} from "@notra/ui/components/brainless/claude/claude-prompt";
import { ClaudeTodoList } from "@notra/ui/components/brainless/claude/claude-todo-list";
import { ClaudeToolCall } from "@notra/ui/components/brainless/claude/claude-tool-call";
import { cn } from "@notra/ui/lib/utils";
import type { ReactNode } from "react";
import { useState } from "react";
import { DesignSystemSectionHeader } from "@/components/design-system/design-system-section-header";
import {
  CLAUDE_STORY_EFFORTS,
  CLAUDE_STORY_MODES,
  CLAUDE_STORY_PROMPT_EFFORTS,
  CLAUDE_STORY_PROMPT_MODES,
  CLAUDE_STORY_SESSION,
  CLAUDE_STORY_TODO_STATES,
  CLAUDE_STORY_TOOL_STATUSES,
} from "@/constants/design-system-claude";

function ClaudeTerminal({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-clip rounded-[1.25rem] bg-[#1E1E1E] [box-shadow:#28282833_0rem_1.5rem_3.5rem_-1rem]",
        className
      )}
    >
      <div className="flex items-center gap-3 bg-[#282828] px-4.5 py-3">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
          <div className="size-2.5 shrink-0 rounded-full bg-[#4A4A4A]" />
        </div>
        {title ? (
          <span className="font-mono text-[#FFFFFF66] text-[0.75rem] leading-4">
            {title}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3.5 p-4 sm:p-6">{children}</div>
    </div>
  );
}

function nextItem<T>(items: readonly T[], current: T): T {
  const index = items.indexOf(current);
  return items[(index + 1) % items.length] ?? current;
}

function ClaudePromptPlayground() {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<ClaudeMode>("auto");
  const [effort, setEffort] = useState<ClaudeEffort>("xhigh");

  return (
    <div className="space-y-3">
      <ClaudeTerminal title="claude — playground">
        <ClaudePrompt
          effort={effort}
          mode={mode}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Tab" && event.shiftKey) {
              event.preventDefault();
              setMode((current) => nextItem(CLAUDE_STORY_MODES, current));
            }
          }}
          placeholder="Type here · Shift+Tab cycles mode"
          value={value}
        />
      </ClaudeTerminal>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
        <span>Effort</span>
        <div className="flex flex-wrap gap-2">
          {CLAUDE_STORY_EFFORTS.map((item) => (
            <button
              aria-pressed={item === effort}
              className={cn(
                "rounded-md px-2 py-1 font-mono transition-colors",
                item === effort
                  ? "bg-muted text-foreground"
                  : "hover:text-foreground"
              )}
              key={item}
              onClick={() => setEffort(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesignSystemClaudeCatalog() {
  const session = CLAUDE_STORY_SESSION;

  return (
    <>
      <section className="scroll-mt-10 space-y-6" id="claude-session">
        <DesignSystemSectionHeader
          description="Header, messages, todos, tool calls, and prompt in one Claude Code window."
          id="claude-session"
          title="Full session"
        />
        <ClaudeTerminal title={session.title}>
          <ClaudeHeader {...session.header} />
          <ClaudeMessage className="mt-1 rounded-sm px-2.5 py-1.5" from="user">
            {session.userMessage}
          </ClaudeMessage>
          <ClaudeMessage>{session.assistantMessage}</ClaudeMessage>
          <ClaudeTodoList todos={session.todos} />
          <div className="flex flex-col gap-2">
            {session.toolCalls.map((call) => (
              <ClaudeToolCall
                arg={call.arg}
                key={call.id}
                result={call.result}
                status={call.status}
                tool={call.tool}
              />
            ))}
          </div>
          <ClaudeMessage>{session.resultMessage}</ClaudeMessage>
          <ClaudePrompt
            className="mt-1"
            effort="xhigh"
            mode="auto"
            placeholder={session.promptPlaceholder}
          />
        </ClaudeTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-header">
        <DesignSystemSectionHeader
          description="Pixel logo plus the welcome banner."
          id="claude-header"
          title="Header"
        />
        <ClaudeTerminal title="claude — header">
          <div className="flex justify-center py-2">
            <ClaudeLogo />
          </div>
          <ClaudeHeader {...session.header} />
        </ClaudeTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-messages">
        <DesignSystemSectionHeader
          description="User turns sit on a darker bar. Assistant turns are plain mono."
          id="claude-messages"
          title="Messages"
        />
        <ClaudeTerminal title="claude — messages">
          <ClaudeMessage className="rounded-sm px-2.5 py-1.5" from="user">
            {session.userMessage}
          </ClaudeMessage>
          <ClaudeMessage>{session.assistantMessage}</ClaudeMessage>
          <ClaudeMessage>{session.resultMessage}</ClaudeMessage>
        </ClaudeTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-todos">
        <DesignSystemSectionHeader
          description="Done, in progress, and pending in the Claude Code todo glyph set."
          id="claude-todos"
          title="Todos"
        />
        <ClaudeTerminal title="claude — todos">
          <ClaudeTodoList todos={CLAUDE_STORY_TODO_STATES} />
        </ClaudeTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-tools">
        <DesignSystemSectionHeader
          description="Success, pending, error, and an expandable Read result."
          id="claude-tools"
          title="Tool calls"
        />
        <ClaudeTerminal title="claude — tools">
          <div className="flex flex-col gap-3">
            {CLAUDE_STORY_TOOL_STATUSES.map((call) => (
              <ClaudeToolCall
                arg={call.arg}
                defaultOpen={Boolean(call.detail)}
                key={call.id}
                result={call.result}
                status={call.status}
                tool={call.tool}
              >
                {call.detail}
              </ClaudeToolCall>
            ))}
          </div>
        </ClaudeTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-modes">
        <DesignSystemSectionHeader
          description="Permission modes. Shift+Tab is the Claude Code cycle."
          id="claude-modes"
          title="Prompt modes"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {CLAUDE_STORY_PROMPT_MODES.map((variant) => (
            <ClaudeTerminal key={variant.id} title={`claude — ${variant.mode}`}>
              <ClaudePrompt
                defaultValue=""
                effort={variant.effort}
                mode={variant.mode}
                placeholder={variant.mode}
              />
            </ClaudeTerminal>
          ))}
        </div>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-effort">
        <DesignSystemSectionHeader
          description="Effort chips, including the ultracode rainbow rule."
          id="claude-effort"
          title="Prompt effort"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {CLAUDE_STORY_PROMPT_EFFORTS.map((variant) => (
            <ClaudeTerminal
              key={variant.id}
              title={`claude — ${variant.effort}`}
            >
              <ClaudePrompt
                defaultValue=""
                effort={variant.effort}
                mode={variant.mode}
                placeholder="/effort"
              />
            </ClaudeTerminal>
          ))}
        </div>
      </section>

      <section className="scroll-mt-10 space-y-6" id="claude-playground">
        <DesignSystemSectionHeader
          description="Type into a live prompt. Shift+Tab cycles mode. Effort is below the window."
          id="claude-playground"
          title="Playground"
        />
        <ClaudePromptPlayground />
      </section>
    </>
  );
}
