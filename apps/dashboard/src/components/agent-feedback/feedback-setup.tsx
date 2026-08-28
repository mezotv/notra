"use client";

import { AiMagicIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { useState } from "react";

import { AgentFeedbackRotateButton } from "@/components/agent-feedback/feedback-rotate-button";
import { ApiKeyRevealField } from "@/components/api-keys/api-key-reveal-field";
import { Button } from "@/components/button";
import { CodeSnippet, useCopyCode } from "@/components/geo/code-snippet";
import { GeoPackageManagerIcon } from "@/components/geo/package-manager-icon";
import {
  AGENT_FEEDBACK_DEFAULT_SNIPPET_TAB,
  AGENT_FEEDBACK_SNIPPET_FILENAMES,
  AGENT_FEEDBACK_SNIPPET_TABS,
  AGENT_FEEDBACK_TOKEN_ENV,
} from "@/constants/agent-feedback";
import {
  GEO_INGEST_DEFAULT_PACKAGE_MANAGER,
  GEO_INGEST_PACKAGE_MANAGER_OPTIONS,
} from "@/constants/geo";
import { cn } from "@/lib/utils";
import type {
  AgentFeedbackSetupPanelProps,
  AgentFeedbackSnippetKey,
} from "@/types/agent-feedback";
import type { GeoIngestPackageManager } from "@/types/geo";
import { isAgentFeedbackSnippetKey } from "@/utils/agent-feedback";
import { isGeoIngestPackageManager } from "@/utils/geo-ingest";

export function AgentFeedbackSetup({
  setup,
  organizationId,
  className,
  showPromptAction = true,
}: AgentFeedbackSetupPanelProps) {
  const [snippetKey, setSnippetKey] = useState<AgentFeedbackSnippetKey>(
    AGENT_FEEDBACK_DEFAULT_SNIPPET_TAB
  );
  const [packageManager, setPackageManager] = useState<GeoIngestPackageManager>(
    GEO_INGEST_DEFAULT_PACKAGE_MANAGER
  );
  const installCommand =
    GEO_INGEST_PACKAGE_MANAGER_OPTIONS.find(
      (option) => option.value === packageManager
    )?.command ?? GEO_INGEST_PACKAGE_MANAGER_OPTIONS[0].command;
  const { copied, copy } = useCopyCode(setup?.prompt ?? "");

  return (
    <div className={cn("space-y-5", className)}>
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pe-1">
          <h3 className="text-sm font-medium">Install the package</h3>
          <Tabs
            className="shrink-0 gap-0"
            onValueChange={(value) => {
              if (value && isGeoIngestPackageManager(value)) {
                setPackageManager(value);
              }
            }}
            value={packageManager}
          >
            <TabsList aria-label="Package manager">
              {GEO_INGEST_PACKAGE_MANAGER_OPTIONS.map((option) => (
                <TabsTrigger
                  aria-label={option.label}
                  className="gap-1 px-2 text-xs"
                  key={option.value}
                  value={option.value}
                >
                  <GeoPackageManagerIcon manager={option.value} />
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <CodeSnippet code={installCommand} variant="command" />
      </section>
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 pe-1">
          <h3 className="text-sm font-medium">Set your token</h3>
          <AgentFeedbackRotateButton
            disabled={!setup}
            organizationId={organizationId}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Add this as{" "}
          <code className="bg-muted text-foreground rounded-sm px-1.5 py-0.5 font-mono text-[0.6875rem]">
            {AGENT_FEEDBACK_TOKEN_ENV}
          </code>{" "}
          in your MCP server's environment. It can only submit feedback.
        </p>
        {setup ? (
          <ApiKeyRevealField value={setup.token} />
        ) : (
          <Skeleton className="h-10 w-full" />
        )}
      </section>
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pe-1">
          <h3 className="text-sm font-medium">
            Add the tool to your MCP server
          </h3>
          <Tabs
            className="shrink-0 gap-0"
            onValueChange={(value) => {
              if (value && isAgentFeedbackSnippetKey(value)) {
                setSnippetKey(value);
              }
            }}
            value={snippetKey}
          >
            <TabsList aria-label="Snippet">
              {AGENT_FEEDBACK_SNIPPET_TABS.map((item) => (
                <TabsTrigger
                  className="px-2 text-xs"
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {setup ? (
          <CodeSnippet
            code={setup.snippets[snippetKey]}
            filename={AGENT_FEEDBACK_SNIPPET_FILENAMES[snippetKey]}
          />
        ) : (
          <Skeleton className="h-44 w-full rounded-lg" />
        )}
      </section>
      {showPromptAction ? (
        <div className="space-y-2">
          <div aria-hidden className="flex items-center gap-3 py-1">
            <span className="bg-border/80 h-px flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <span className="bg-border/80 h-px flex-1" />
          </div>
          <Button
            className="text-muted-foreground mx-auto flex w-fit"
            disabled={!setup}
            onClick={copy}
            size="sm"
            variant="ghost"
          >
            <HugeiconsIcon icon={copied ? Tick01Icon : AiMagicIcon} size={14} />
            {copied ? "Prompt copied" : "Copy agent prompt"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
