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
          <h3 className="font-medium text-sm">Install the package</h3>
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
                  className="px-2 text-xs dark:data-active:bg-background"
                  key={option.value}
                  value={option.value}
                >
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
          <h3 className="font-medium text-sm">Set your token</h3>
          <AgentFeedbackRotateButton
            disabled={!setup}
            organizationId={organizationId}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Add this as {AGENT_FEEDBACK_TOKEN_ENV} in your MCP server's
          environment. It can only submit feedback.
        </p>
        {setup ? (
          <ApiKeyRevealField value={setup.token} />
        ) : (
          <Skeleton className="h-10 w-full" />
        )}
      </section>
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pe-1">
          <h3 className="font-medium text-sm">
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
                  className="px-2 text-xs dark:data-active:bg-background"
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
      <div className="space-y-2">
        <div aria-hidden className="flex items-center gap-3 py-1">
          <span className="h-px flex-1 bg-border/80" />
          <span className="text-muted-foreground text-xs">or</span>
          <span className="h-px flex-1 bg-border/80" />
        </div>
        <Button
          className="mx-auto flex w-fit text-muted-foreground"
          disabled={!setup}
          onClick={copy}
          size="sm"
          variant="ghost"
        >
          <HugeiconsIcon icon={copied ? Tick01Icon : AiMagicIcon} size={14} />
          {copied ? "Prompt copied" : "Copy agent prompt"}
        </Button>
      </div>
    </div>
  );
}
