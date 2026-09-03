"use client";

import {
  AlertCircleIcon,
  ArrowUpRight01Icon,
  GitCommitIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@notra/ui/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@notra/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Notra } from "@notra/ui/components/ui/svgs/notra";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import {
  DEFAULT_GITHUB_CONTENT_OUTPUT_ENABLED,
  GITHUB_RECOVERY_COPY,
} from "@/constants/github";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { PublishContentToGitHubDialogProps } from "@/types/content/detail";
import { getGitHubPublishRecovery } from "@/utils/github-publish-recovery";

export function PublishContentToGitHubDialog({
  contentId,
  contentType,
  onSave,
  organizationId,
  organizationSlug,
  title,
}: PublishContentToGitHubDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [repositoryId, setRepositoryId] = useState("");
  const contentLabel = contentType === "changelog" ? "changelog" : "blog post";

  const integrationsQuery = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: open,
      staleTime: 5 * 60 * 1000,
    })
  );

  const connectedRepositories =
    integrationsQuery.data?.integrations.flatMap((integration) =>
      integration.type === "github" &&
      integration.enabled &&
      integration.repositories.length > 0
        ? integration.repositories.filter((repository) => repository.enabled)
        : []
    ) ?? [];
  const outputEnabledRepositories = connectedRepositories.filter(
    (repository) => {
      const output = repository.outputs?.find(
        (candidate) => candidate.outputType === contentType
      );
      return (
        output?.enabled ?? DEFAULT_GITHUB_CONTENT_OUTPUT_ENABLED[contentType]
      );
    }
  );
  const repositories = outputEnabledRepositories.filter(
    (repository) => repository.defaultBranch
  );
  const integrationsLoadFailed =
    integrationsQuery.isError && !integrationsQuery.data;
  const selectedRepository = repositories.find(
    (repository) => repository.id === repositoryId
  );

  const publishMutation = useMutation({
    mutationFn: async (targetRepositoryId: string) => {
      const saved = await onSave();
      if (!saved) {
        throw new Error(`Save the ${contentLabel} before publishing it`);
      }

      return dashboardOrpc.content.publishChangelogToGitHub.call({
        organizationId,
        contentId,
        contentType,
        repositoryId: targetRepositoryId,
      });
    },
    onSuccess: (result) => {
      toast.success(
        result.operation === "created"
          ? "Draft pull request created"
          : "Pull request updated"
      );
    },
    onError: (error) => {
      const recovery = getGitHubPublishRecovery(error);
      if (recovery) {
        if (
          recovery.code === "github_content_publishing_paused" ||
          recovery.publishingPaused
        ) {
          queryClient.invalidateQueries({
            queryKey: dashboardOrpc.integrations.list.queryKey({
              input: { organizationId },
            }),
          });
        }
        return;
      }
      toast.error(error.message || "Failed to create draft pull request");
    },
  });
  const pullRequest = publishMutation.data;
  const pullRequestWasCreated = pullRequest?.operation === "created";
  const publishRecovery = getGitHubPublishRecovery(publishMutation.error);
  const recoveryCopy = publishRecovery
    ? GITHUB_RECOVERY_COPY[publishRecovery.code]
    : null;
  const showIntegrationRecovery =
    publishRecovery &&
    (publishRecovery.publishingPaused ||
      publishRecovery.code !== "github_app_permissions_required" ||
      !publishRecovery.permissionsUrl);
  const showPermissionsRecovery =
    publishRecovery?.code === "github_app_permissions_required" &&
    Boolean(publishRecovery.permissionsUrl);
  let dialogTitle = "Create a draft pull request";
  let dialogDescription = `Notra creates a branch, adds the ${contentLabel} as Markdown, and opens a draft pull request against the repository's default branch.`;
  if (pullRequest) {
    dialogTitle = pullRequestWasCreated
      ? "Draft pull request created"
      : "Pull request updated";
    dialogDescription = pullRequestWasCreated
      ? `Notra added the ${contentLabel} and opened a draft pull request.`
      : `Notra updated the ${contentLabel} in the existing pull request.`;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!publishMutation.isPending) {
      setOpen(nextOpen);
      if (nextOpen) {
        publishMutation.reset();
      }
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedRepository) {
      publishMutation.mutate(selectedRepository.id);
    }
  };

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogTrigger render={<Button size="sm" variant="outline" />}>
        <Github className="size-4" />
        Create GitHub PR
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{dialogTitle}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {dialogDescription}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {pullRequest ? (
            <div className="bg-muted/20 my-4 overflow-hidden rounded-lg border">
              <div className="flex items-start gap-3 p-3">
                <div className="ring-foreground/10 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f3f1] p-1 ring-1">
                  <Notra className="size-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    docs: add {title}
                  </p>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {selectedRepository
                      ? `${selectedRepository.owner}/${selectedRepository.repo}`
                      : "Repository"}
                    #{pullRequest.pullRequestNumber} ·{" "}
                    {pullRequestWasCreated ? "Created as draft" : "Updated"}
                  </p>
                </div>
                <a
                  aria-label={`Open pull request #${pullRequest.pullRequestNumber} on GitHub`}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  href={pullRequest.pullRequestUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <HugeiconsIcon className="size-4" icon={ArrowUpRight01Icon} />
                </a>
              </div>

              <div className="text-muted-foreground flex min-w-0 items-center gap-2 border-t px-3 py-2.5 text-xs">
                <HugeiconsIcon
                  className="size-4 shrink-0"
                  icon={GitCommitIcon}
                />
                <span className="truncate">
                  {pullRequestWasCreated ? "Added" : "Updated"}{" "}
                  {pullRequest.path}
                </span>
                <span aria-hidden="true">·</span>
                <span className="max-w-32 truncate font-mono">
                  {pullRequest.branchName}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-6">
              <Field>
                <FieldLabel htmlFor="github-publish-repository">
                  Repository
                </FieldLabel>
                <Select
                  disabled={
                    publishMutation.isPending ||
                    integrationsLoadFailed ||
                    repositories.length === 0
                  }
                  onValueChange={(value) => setRepositoryId(value ?? "")}
                  value={repositoryId}
                >
                  <SelectTrigger id="github-publish-repository">
                    <SelectValue
                      placeholder={
                        integrationsQuery.isLoading
                          ? "Loading repositories…"
                          : "Select a repository"
                      }
                    >
                      {(value) => {
                        const repository = repositories.find(
                          (candidate) => candidate.id === value
                        );
                        return repository
                          ? `${repository.owner}/${repository.repo}`
                          : "Select a repository";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repository) => (
                      <SelectItem key={repository.id} value={repository.id}>
                        {repository.owner}/{repository.repo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {integrationsLoadFailed ? (
                  <div
                    className="border-destructive/30 flex items-center justify-between gap-3 rounded-lg border p-3"
                    role="alert"
                  >
                    <p className="text-destructive text-sm">
                      Unable to load GitHub repositories.
                    </p>
                    <Button
                      onClick={() => integrationsQuery.refetch()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Retry
                    </Button>
                  </div>
                ) : null}
                {!integrationsQuery.isLoading &&
                !integrationsLoadFailed &&
                connectedRepositories.length === 0 ? (
                  <FieldDescription>
                    No enabled GitHub repositories are connected. Open the{" "}
                    <Link
                      className="underline underline-offset-4"
                      href={`/${organizationSlug}/integrations/github`}
                    >
                      GitHub integration
                    </Link>{" "}
                    to connect or enable one.
                  </FieldDescription>
                ) : null}
                {!integrationsQuery.isLoading &&
                connectedRepositories.length > 0 &&
                outputEnabledRepositories.length === 0 ? (
                  <FieldDescription>
                    {contentLabel === "blog post" ? "Blog post" : "Changelog"}{" "}
                    publishing is off. Open the{" "}
                    <Link
                      className="underline underline-offset-4"
                      href={`/${organizationSlug}/integrations/github`}
                    >
                      GitHub integration
                    </Link>{" "}
                    to enable it.
                  </FieldDescription>
                ) : null}
                {!integrationsQuery.isLoading &&
                outputEnabledRepositories.length > 0 &&
                repositories.length === 0 ? (
                  <FieldDescription>
                    These repositories need a default branch before they can
                    publish to GitHub.
                  </FieldDescription>
                ) : null}
              </Field>
              {publishRecovery ? (
                <Alert variant="destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} />
                  <AlertTitle>{recoveryCopy?.title}</AlertTitle>
                  <AlertDescription>
                    <p>{recoveryCopy?.description}</p>
                    {publishRecovery.publishingPaused ? (
                      <p>
                        Publishing was also paused after three failures. Resume
                        it in the GitHub integration after fixing this.
                      </p>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={publishMutation.isPending}
              render={<Button variant="outline" />}
            >
              Close
            </ResponsiveDialogClose>
            {showIntegrationRecovery ? (
              <Button
                nativeButton={false}
                render={
                  <Link href={`/${organizationSlug}/integrations/github`}>
                    Open GitHub integration
                  </Link>
                }
              />
            ) : null}
            {showPermissionsRecovery && publishRecovery.permissionsUrl ? (
              <Button
                nativeButton={false}
                render={
                  <a
                    href={publishRecovery.permissionsUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Update permissions
                    <HugeiconsIcon
                      className="size-4"
                      icon={ArrowUpRight01Icon}
                    />
                  </a>
                }
              />
            ) : null}
            {!publishRecovery && pullRequest ? (
              <Button
                nativeButton={false}
                render={
                  <a
                    href={pullRequest.pullRequestUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open pull request
                    <HugeiconsIcon
                      className="size-4"
                      icon={ArrowUpRight01Icon}
                    />
                  </a>
                }
              />
            ) : null}
            {publishRecovery || pullRequest ? null : (
              <Button
                disabled={publishMutation.isPending || !selectedRepository}
                type="submit"
              >
                {publishMutation.isPending
                  ? "Creating draft PR…"
                  : "Create draft PR"}
              </Button>
            )}
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
