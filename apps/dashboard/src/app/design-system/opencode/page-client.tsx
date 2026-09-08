"use client";

import { OpencodeActivity } from "@notra/ui/components/brainless/opencode/opencode-activity";
import { OpencodeComposer } from "@notra/ui/components/brainless/opencode/opencode-composer";
import { OpencodeLogo } from "@notra/ui/components/brainless/opencode/opencode-logo";
import { OpencodeMessage } from "@notra/ui/components/brainless/opencode/opencode-message";
import { OpencodeSidebar } from "@notra/ui/components/brainless/opencode/opencode-sidebar";
import { OpencodeSources } from "@notra/ui/components/brainless/opencode/opencode-sources";
import { OPENCODE_COLORS } from "@notra/ui/constants/brainless-opencode";
import { cn } from "@notra/ui/lib/utils";
import type { ReactNode } from "react";

import { DesignSystemSectionHeader } from "@/components/design-system/design-system-section-header";
import {
  OPENCODE_STORY_ACTIVITIES,
  OPENCODE_STORY_SESSION,
  OPENCODE_STORY_SOURCES,
} from "@/constants/design-system-opencode";

function OpencodeSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-[1.25rem] border font-mono",
        className
      )}
      style={{
        borderColor: OPENCODE_COLORS.subtle,
        background: OPENCODE_COLORS.background,
      }}
    >
      {children}
    </div>
  );
}

export function DesignSystemOpencodeCatalog() {
  const session = OPENCODE_STORY_SESSION;

  return (
    <>
      <section className="scroll-mt-10 space-y-6" id="opencode-session">
        <DesignSystemSectionHeader
          description="Conversation, activity stream, composer, context, MCP servers, and session status in one OpenCode workspace."
          id="opencode-session"
          title="Full session"
        />
        <OpencodeSurface>
          <div className="grid min-h-[34rem] md:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="flex min-w-0 flex-col p-4 sm:p-6">
              <div className="space-y-5">
                <OpencodeMessage from="user">
                  {session.userMessage}
                </OpencodeMessage>
                {session.activities.slice(0, 1).map((activity) => (
                  <OpencodeActivity key={activity.id} {...activity} />
                ))}
                <OpencodeMessage>{session.assistantMessage}</OpencodeMessage>
                <div className="space-y-2.5">
                  {session.activities.slice(1).map((activity) => (
                    <OpencodeActivity key={activity.id} {...activity} />
                  ))}
                </div>
                <OpencodeSources sources={OPENCODE_STORY_SOURCES} />
                <OpencodeMessage>{session.resultMessage}</OpencodeMessage>
              </div>
              <OpencodeComposer
                className="mt-auto pt-10"
                context={session.context}
                placeholder={session.promptPlaceholder}
              />
              <div
                className="mt-2 text-[11px]"
                style={{ color: OPENCODE_COLORS.muted }}
              >
                {session.cwd}
              </div>
            </div>
            <OpencodeSidebar
              className="hidden md:flex"
              cwd={session.cwd}
              servers={session.servers}
              title={session.title}
              tokens={session.tokens}
              used={session.used}
            />
          </div>
        </OpencodeSurface>
      </section>

      <section className="scroll-mt-10 space-y-6" id="opencode-home">
        <DesignSystemSectionHeader
          description="Centered OpenCode welcome state with the signature pixel logo and prompt."
          id="opencode-home"
          title="Home"
        />
        <OpencodeSurface>
          <div className="flex min-h-[28rem] flex-col px-5 py-6">
            <div className="m-auto w-full max-w-xl">
              <OpencodeLogo
                className="mx-auto mb-10 h-auto max-w-full"
                scale={1.8}
              />
              <OpencodeComposer />
              <div
                className="mt-16 text-center text-[11px]"
                style={{ color: OPENCODE_COLORS.muted }}
              >
                <span style={{ color: OPENCODE_COLORS.orange }}>● Tip</span>{" "}
                Create JSON theme files in{" "}
                <span style={{ color: OPENCODE_COLORS.foreground }}>
                  .opencode/themes/
                </span>{" "}
                directory
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: OPENCODE_COLORS.muted }}>
                {session.cwd} · 3 MCP
              </span>
              <span style={{ color: OPENCODE_COLORS.muted }}>1.18.25</span>
            </div>
          </div>
        </OpencodeSurface>
      </section>

      <section className="scroll-mt-10 space-y-6" id="opencode-activity">
        <DesignSystemSectionHeader
          description="User and assistant turns plus orange reasoning, muted tool activity, and cited sources."
          id="opencode-activity"
          title="Messages & activity"
        />
        <OpencodeSurface className="p-5 sm:p-6">
          <div className="space-y-5">
            <OpencodeMessage from="user">{session.userMessage}</OpencodeMessage>
            <OpencodeMessage
              search={<OpencodeSources sources={OPENCODE_STORY_SOURCES} />}
            >
              {session.assistantMessage}
            </OpencodeMessage>
            {OPENCODE_STORY_ACTIVITIES.map((activity) => (
              <OpencodeActivity key={activity.id} {...activity} />
            ))}
          </div>
        </OpencodeSurface>
      </section>

      <section className="scroll-mt-10 space-y-6" id="opencode-composer">
        <DesignSystemSectionHeader
          description="Prompt, agent, model, provider, effort, shortcuts, and context usage."
          id="opencode-composer"
          title="Composer"
        />
        <OpencodeSurface className="p-5 sm:p-6">
          <OpencodeComposer context={session.context} />
        </OpencodeSurface>
      </section>

      <section className="scroll-mt-10 space-y-6" id="opencode-sidebar">
        <DesignSystemSectionHeader
          description="Context budget, MCP connectivity, LSP state, working directory, and version."
          id="opencode-sidebar"
          title="Sidebar"
        />
        <OpencodeSurface className="max-w-sm">
          <OpencodeSidebar
            className="min-h-[28rem] border-l-0"
            cwd={session.cwd}
            servers={session.servers}
            title={session.title}
            tokens={session.tokens}
            used={session.used}
          />
        </OpencodeSurface>
      </section>
    </>
  );
}
