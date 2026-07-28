"use client";

import { ArrowUpRight01Icon, GitCommitIcon } from "@hugeicons/core-free-icons";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { PublishChangelogDialogProps } from "@/types/content/detail";

export function PublishChangelogDialog({
  contentId,
  onSave,
  organizationId,
  organizationSlug,
  title,
}: PublishChangelogDialogProps) {
  const [open, setOpen] = useState(false);
  const [repositoryId, setRepositoryId] = useState("");

  const integrationsQuery = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: open,
      staleTime: 5 * 60 * 1000,
    })
  );

  const repositories =
    integrationsQuery.data?.integrations.flatMap((integration) =>
      integration.type === "github" &&
      integration.enabled &&
      integration.repositories.length > 0
        ? integration.repositories.filter((repository) => repository.enabled)
        : []
    ) ?? [];
  const selectedRepository = repositories.find(
    (repository) => repository.id === repositoryId
  );

  const publishMutation = useMutation({
    mutationFn: async (targetRepositoryId: string) => {
      const saved = await onSave();
      if (!saved) {
        throw new Error("Save the changelog before publishing it");
      }

      return dashboardOrpc.content.publishChangelogToGitHub.call({
        organizationId,
        contentId,
        repositoryId: targetRepositoryId,
      });
    },
    onSuccess: () => {
      toast.success("Draft pull request created");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create draft pull request");
    },
  });
  const pullRequest = publishMutation.data;

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
            <ResponsiveDialogTitle>
              Create a draft pull request
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Notra creates a branch, adds the changelog as Markdown, and opens
              a draft pull request against the repository&apos;s default branch.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          {pullRequest ? (
            <div className="my-4 overflow-hidden rounded-lg border bg-muted/20">
              <div className="flex items-start gap-3 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f3f1] p-1 ring-1 ring-foreground/10">
                  <Notra className="size-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    docs: add {title}
                  </p>
                  <p className="mt-1 truncate text-muted-foreground text-xs">
                    {selectedRepository
                      ? `${selectedRepository.owner}/${selectedRepository.repo}`
                      : "Repository"}
                    #{pullRequest.pullRequestNumber} · Opened by Notra Bot ·
                    Draft
                  </p>
                </div>
                <a
                  aria-label={`Open draft pull request #${pullRequest.pullRequestNumber} on GitHub`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={pullRequest.pullRequestUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <HugeiconsIcon className="size-4" icon={ArrowUpRight01Icon} />
                </a>
              </div>

              <div className="flex min-w-0 items-center gap-2 border-t px-3 py-2.5 text-muted-foreground text-xs">
                <HugeiconsIcon
                  className="size-4 shrink-0"
                  icon={GitCommitIcon}
                />
                <span className="shrink-0">1 commit</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">Added {pullRequest.path}</span>
                <span aria-hidden="true">·</span>
                <span className="max-w-32 truncate font-mono">
                  {pullRequest.branchName}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-6">
              <Field>
                <FieldLabel htmlFor="changelog-repository">
                  Repository
                </FieldLabel>
                <Select
                  disabled={publishMutation.isPending}
                  onValueChange={(value) => setRepositoryId(value ?? "")}
                  value={repositoryId}
                >
                  <SelectTrigger id="changelog-repository">
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
                {!integrationsQuery.isLoading && repositories.length === 0 ? (
                  <FieldDescription>
                    No GitHub repositories available. Open the{" "}
                    <Link
                      className="underline underline-offset-4"
                      href={`/${organizationSlug}/integrations/github`}
                    >
                      GitHub integration
                    </Link>{" "}
                    to connect one.
                  </FieldDescription>
                ) : null}
              </Field>
            </div>
          )}

          <ResponsiveDialogFooter>
            <ResponsiveDialogClose
              disabled={publishMutation.isPending}
              render={<Button variant="outline" />}
            >
              Close
            </ResponsiveDialogClose>
            {pullRequest ? (
              <Button
                nativeButton={false}
                render={
                  <a
                    href={pullRequest.pullRequestUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open draft PR
                    <HugeiconsIcon
                      className="size-4"
                      icon={ArrowUpRight01Icon}
                    />
                  </a>
                }
              />
            ) : (
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
