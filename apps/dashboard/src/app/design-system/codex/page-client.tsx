"use client";

import { CodexComposer } from "@notra/ui/components/brainless/codex/codex-composer";
import { CodexExec } from "@notra/ui/components/brainless/codex/codex-exec";
import { CodexHeader } from "@notra/ui/components/brainless/codex/codex-header";
import { CodexMessage } from "@notra/ui/components/brainless/codex/codex-message";
import { cn } from "@notra/ui/lib/utils";
import type { ReactNode } from "react";
import { DesignSystemSectionHeader } from "@/components/design-system/design-system-section-header";
import {
  CODEX_STORY_EXECS,
  CODEX_STORY_SESSION,
} from "@/constants/design-system-codex";

function CodexTerminal({
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
        "flex w-full flex-col overflow-clip rounded-[1.25rem] bg-[#191919] [box-shadow:#28282833_0rem_1.5rem_3.5rem_-1rem]",
        className
      )}
    >
      <div className="flex items-center gap-3 bg-[#242424] px-4.5 py-3">
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

export function DesignSystemCodexCatalog() {
  const session = CODEX_STORY_SESSION;

  return (
    <>
      <section className="scroll-mt-10 space-y-6" id="codex-session">
        <DesignSystemSectionHeader
          description="Header, messages, exec cells, and composer in one Codex window."
          id="codex-session"
          title="Full session"
        />
        <CodexTerminal title={session.title}>
          <CodexHeader {...session.header} />
          <CodexMessage from="user">{session.userMessage}</CodexMessage>
          <CodexMessage>{session.assistantMessage}</CodexMessage>
          <div className="flex flex-col gap-2">
            {session.execs.map((exec) => (
              <CodexExec
                command={exec.command}
                key={exec.id}
                output={exec.output}
                status={exec.status}
              />
            ))}
          </div>
          <CodexMessage>{session.resultMessage}</CodexMessage>
          <CodexComposer
            className="mt-1"
            context={session.context}
            cwd={session.header.cwd}
            model={session.header.model}
            placeholder={session.promptPlaceholder}
          />
        </CodexTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="codex-header">
        <DesignSystemSectionHeader
          description="Model, version, and working directory."
          id="codex-header"
          title="Header"
        />
        <CodexTerminal title="codex — header">
          <CodexHeader {...session.header} />
        </CodexTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="codex-messages">
        <DesignSystemSectionHeader
          description="User turns use a green ›. Assistant turns are plain mono."
          id="codex-messages"
          title="Messages"
        />
        <CodexTerminal title="codex — messages">
          <CodexMessage from="user">{session.userMessage}</CodexMessage>
          <CodexMessage>{session.assistantMessage}</CodexMessage>
          <CodexMessage>{session.resultMessage}</CodexMessage>
        </CodexTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="codex-exec">
        <DesignSystemSectionHeader
          description="Ran, running, and failed command cells."
          id="codex-exec"
          title="Exec"
        />
        <CodexTerminal title="codex — exec">
          <div className="flex flex-col gap-3">
            {CODEX_STORY_EXECS.map((exec) => (
              <CodexExec
                command={exec.command}
                key={exec.id}
                output={exec.output}
                status={exec.status}
              />
            ))}
          </div>
        </CodexTerminal>
      </section>

      <section className="scroll-mt-10 space-y-6" id="codex-composer">
        <DesignSystemSectionHeader
          description="Prompt plus the model / context / cwd status line."
          id="codex-composer"
          title="Composer"
        />
        <CodexTerminal title="codex — composer">
          <CodexComposer
            context={session.context}
            cwd={session.header.cwd}
            model={session.header.model}
            placeholder={session.promptPlaceholder}
          />
        </CodexTerminal>
      </section>
    </>
  );
}
