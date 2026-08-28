"use client";

import {
  Alert02Icon,
  AlertCircleIcon,
  Copy01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";

import { Button } from "@/components/button";
import { useCopyCode } from "@/components/geo/code-snippet";
import { InstrumentModule } from "@/components/instrument/instrument-module";
import {
  AGENT_READINESS_MUST_DO_HINT,
  AGENT_READINESS_MUST_DO_LABEL,
  AGENT_READINESS_SHOULD_DO_HINT,
  AGENT_READINESS_SHOULD_DO_LABEL,
} from "@/constants/agent-readiness";
import type {
  AgentReadinessChecklistProps,
  AgentReadinessChecklistPromptActionsProps,
  AgentReadinessCopyPromptButtonProps,
  AgentReadinessIssueEntryProps,
  AgentReadinessIssueGroups,
  AgentReadinessResultBadgeProps,
  AgentReadinessSectionHeaderProps,
} from "@/types/agent-readiness";
import {
  buildAgentReadinessAllFixesPrompt,
  buildAgentReadinessFixPrompt,
  groupAgentReadinessIssues,
} from "@/utils/agent-readiness";

function CopyPromptButton({
  prompt,
  label,
  variant = "outline",
  size = "sm",
}: AgentReadinessCopyPromptButtonProps) {
  const { copied, copy } = useCopyCode(prompt);

  return (
    <Button
      className="shrink-0"
      onClick={copy}
      size={size}
      type="button"
      variant={variant}
    >
      <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={14} />
      {copied ? "Copied" : label}
    </Button>
  );
}

function ResultBadge({ result }: AgentReadinessResultBadgeProps) {
  if (result === "failed") {
    return <Badge variant="destructive">Failed</Badge>;
  }

  return (
    <Badge
      className="border-amber-500/40 text-amber-700 dark:text-amber-400"
      variant="outline"
    >
      Partial
    </Badge>
  );
}

function formatIssueIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function buildFullBacklogPrompt(
  targetUrl: string,
  groups: AgentReadinessIssueGroups
): string {
  return buildAgentReadinessAllFixesPrompt(targetUrl, [
    ...groups.mustDo,
    ...groups.shouldDo,
  ]);
}

function ChecklistPromptActions({
  targetUrl,
  groups,
}: AgentReadinessChecklistPromptActionsProps) {
  const hasMustDo = groups.mustDo.length > 0;
  const hasShouldDo = groups.shouldDo.length > 0;
  const masterPrompt = buildAgentReadinessAllFixesPrompt(
    targetUrl,
    hasMustDo ? groups.mustDo : groups.shouldDo
  );

  return (
    <>
      <CopyPromptButton
        label="Copy master prompt"
        prompt={masterPrompt}
        variant="default"
      />
      {hasMustDo && hasShouldDo ? (
        <CopyPromptButton
          label="Copy full backlog"
          prompt={buildFullBacklogPrompt(targetUrl, groups)}
        />
      ) : null}
    </>
  );
}

function IssueEntry({
  issue,
  index,
  targetUrl,
}: AgentReadinessIssueEntryProps) {
  const fixPrompt = buildAgentReadinessFixPrompt(targetUrl, issue);

  return (
    <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 border-b py-5 last:border-b-0">
      <span className="text-muted-foreground pt-0.5 text-sm tabular-nums">
        {formatIssueIndex(index)}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="text-sm font-semibold tracking-tight">{issue.name}</h3>
          <ResultBadge result={issue.result} />
        </div>
        {issue.details ? (
          <p className="text-muted-foreground mt-1.5 text-sm">
            {issue.details}
          </p>
        ) : null}
        {issue.recommendation ? (
          <div className="mt-3 overflow-hidden rounded-lg border">
            <div className="bg-muted/40 flex items-center justify-between gap-2 border-b py-1 pr-1 pl-3">
              <span className="text-muted-foreground text-xs font-medium">
                Suggested fix
              </span>
              <CopyPromptButton
                label="Copy fix"
                prompt={fixPrompt}
                size="xs"
                variant="ghost"
              />
            </div>
            <p className="text-muted-foreground px-3 py-2.5 text-sm">
              {issue.recommendation}
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <CopyPromptButton label="Copy fix" prompt={fixPrompt} />
          </div>
        )}
      </div>
    </article>
  );
}

function SectionHeader({
  icon,
  iconClassName,
  label,
  hint,
  count,
}: AgentReadinessSectionHeaderProps) {
  return (
    <div className="pb-2">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <HugeiconsIcon
          className={iconClassName}
          icon={icon}
          size={16}
          strokeWidth={2}
        />
        {label}
        <span className="text-muted-foreground bg-muted rounded-full px-1.5 py-px text-xs font-medium tabular-nums">
          {count}
        </span>
      </span>
      <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
    </div>
  );
}

export function AgentReadinessChecklist({
  targetUrl,
  issues,
}: AgentReadinessChecklistProps) {
  const groups = groupAgentReadinessIssues(issues);
  const hasFixableIssues =
    groups.mustDo.length > 0 || groups.shouldDo.length > 0;

  return (
    <InstrumentModule
      action={
        hasFixableIssues ? (
          <ChecklistPromptActions groups={groups} targetUrl={targetUrl} />
        ) : undefined
      }
      bodyClassName="gap-0 px-5 pb-2"
      eyebrow="Checklist"
      variant="table"
    >
      {groups.mustDo.length > 0 ? (
        <section className="pt-6 first:pt-1">
          <SectionHeader
            count={groups.mustDo.length}
            hint={AGENT_READINESS_MUST_DO_HINT}
            icon={AlertCircleIcon}
            iconClassName="text-destructive"
            label={AGENT_READINESS_MUST_DO_LABEL}
          />
          <div>
            {groups.mustDo.map((issue, index) => (
              <IssueEntry
                index={index}
                issue={issue}
                key={issue.id}
                targetUrl={targetUrl}
              />
            ))}
          </div>
        </section>
      ) : null}
      {groups.shouldDo.length > 0 ? (
        <section className="pt-6 first:pt-1">
          <SectionHeader
            count={groups.shouldDo.length}
            hint={AGENT_READINESS_SHOULD_DO_HINT}
            icon={Alert02Icon}
            iconClassName="text-amber-600 dark:text-amber-400"
            label={AGENT_READINESS_SHOULD_DO_LABEL}
          />
          <div>
            {groups.shouldDo.map((issue, index) => (
              <IssueEntry
                index={groups.mustDo.length + index}
                issue={issue}
                key={issue.id}
                targetUrl={targetUrl}
              />
            ))}
          </div>
        </section>
      ) : null}
      {hasFixableIssues ? null : (
        <p className="text-muted-foreground py-8 text-sm">
          All eligible checks passed
        </p>
      )}
    </InstrumentModule>
  );
}
