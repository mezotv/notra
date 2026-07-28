"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Field, FieldLabel } from "@notra/ui/components/ui/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@notra/ui/components/ui/radio-group";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { DEFAULT_CHANGELOG_DIRECTORY } from "@/constants/github";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  GitHubChangelogDirectoryMutationVariables,
  GitHubChangelogSettingsProps,
} from "@/types/integrations/github";
import { GitHubDirectoryPicker } from "./github-directory-picker";

export function GitHubChangelogSettings({
  organizationId,
  repositories,
}: GitHubChangelogSettingsProps) {
  const queryClient = useQueryClient();
  const folderTriggerId = useId();
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const selectedRepository =
    repositories.find((repository) => repository.id === selectedRepositoryId) ??
    repositories[0];
  const repositoryId = selectedRepository?.id ?? "";
  const directoryQuery = useQuery(
    dashboardOrpc.integrations.repositories.contentDirectory.get.queryOptions({
      input: {
        organizationId,
        repositoryId,
        contentType: "changelog",
      },
      enabled: Boolean(organizationId && repositoryId),
      staleTime: 0,
    })
  );
  const directory = directoryQuery.isSuccess
    ? (directoryQuery.data.directory ?? DEFAULT_CHANGELOG_DIRECTORY)
    : DEFAULT_CHANGELOG_DIRECTORY;
  const directoryMutation = useMutation({
    mutationFn: ({
      nextDirectory,
      targetRepositoryId,
    }: GitHubChangelogDirectoryMutationVariables) =>
      dashboardOrpc.integrations.repositories.contentDirectory.update.call({
        organizationId,
        repositoryId: targetRepositoryId,
        contentType: "changelog",
        directory: nextDirectory,
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey:
          dashboardOrpc.integrations.repositories.contentDirectory.get.queryKey(
            {
              input: {
                organizationId,
                repositoryId: variables.targetRepositoryId,
                contentType: "changelog",
              },
            }
          ),
      });
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(
        dashboardOrpc.integrations.repositories.contentDirectory.get.queryKey({
          input: {
            organizationId,
            repositoryId: variables.targetRepositoryId,
            contentType: "changelog",
          },
        }),
        result
      );
      toast.success("Changelog folder saved");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save changelog folder");
    },
  });

  if (!selectedRepository) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changelog publishing</CardTitle>
        <CardDescription>
          Choose where each repository stores generated changelogs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup
          aria-label="Repository"
          className="flex max-w-full grid-cols-none gap-1 overflow-x-auto rounded-lg bg-muted p-[3px]"
          onValueChange={(value) => {
            if (typeof value === "string") {
              setSelectedRepositoryId(value);
            }
          }}
          value={selectedRepository.id}
        >
          {repositories.map((repository) => {
            const radioId = `${folderTriggerId}-${repository.id}`;
            return (
              <label
                className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2 font-medium text-foreground/60 text-sm transition-colors hover:text-foreground has-data-checked:bg-background has-data-checked:text-foreground has-data-checked:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                htmlFor={radioId}
                key={repository.id}
              >
                <RadioGroupItem
                  className="sr-only"
                  id={radioId}
                  value={repository.id}
                />
                <Github className="size-3.5" />
                {repository.owner}/{repository.repo}
              </label>
            );
          })}
        </RadioGroup>

        <Field className="max-w-xl">
          <FieldLabel htmlFor={folderTriggerId}>Changelog folder</FieldLabel>
          {directoryQuery.isError && !directoryQuery.data ? (
            <div
              className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-destructive/30 px-3"
              role="alert"
            >
              <p className="text-destructive text-sm">
                Unable to load the changelog folder.
              </p>
              <Button
                onClick={() => directoryQuery.refetch()}
                size="sm"
                type="button"
                variant="ghost"
              >
                Retry
              </Button>
            </div>
          ) : (
            <GitHubDirectoryPicker
              directory={directory}
              disabled={directoryQuery.isLoading}
              isSaving={directoryMutation.isPending}
              onSave={async (nextDirectory) => {
                await directoryMutation.mutateAsync({
                  nextDirectory,
                  targetRepositoryId: selectedRepository.id,
                });
              }}
              organizationId={organizationId}
              repositoryId={selectedRepository.id}
              repositoryName={`${selectedRepository.owner}/${selectedRepository.repo}`}
              triggerId={folderTriggerId}
            />
          )}
        </Field>
      </CardContent>
    </Card>
  );
}
