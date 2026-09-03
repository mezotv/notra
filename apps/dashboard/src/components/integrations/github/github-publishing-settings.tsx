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
import { Switch } from "@notra/ui/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import {
  DEFAULT_GITHUB_CONTENT_DIRECTORIES,
  DEFAULT_GITHUB_CONTENT_OUTPUT_ENABLED,
} from "@/constants/github";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  GitHubContentDirectoryMutationVariables,
  GitHubContentPublishingSettingsProps,
  GitHubOutputMutationVariables,
  GitHubPublishingSettingsProps,
} from "@/types/integrations/github";

import { GitHubDirectoryPicker } from "./github-directory-picker";

function GitHubContentPublishingSettings({
  contentLabel,
  contentType,
  organizationId,
  pluralLabel,
  repositories,
}: GitHubContentPublishingSettingsProps) {
  const queryClient = useQueryClient();
  const folderTriggerId = useId();
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const selectedRepository =
    repositories.find((repository) => repository.id === selectedRepositoryId) ??
    repositories[0];
  const repositoryId = selectedRepository?.id ?? "";
  const contentOutput = selectedRepository?.outputs?.find(
    (output) => output.outputType === contentType
  );
  const publishingEnabled =
    contentOutput?.enabled ??
    DEFAULT_GITHUB_CONTENT_OUTPUT_ENABLED[contentType];
  const directoryQuery = useQuery(
    dashboardOrpc.integrations.repositories.contentDirectory.get.queryOptions({
      input: {
        organizationId,
        repositoryId,
        contentType,
      },
      enabled: Boolean(organizationId && repositoryId),
      staleTime: 0,
    })
  );
  const directory =
    directoryQuery.data?.directory ??
    DEFAULT_GITHUB_CONTENT_DIRECTORIES[contentType];
  const directoryMutation = useMutation({
    mutationFn: ({
      nextDirectory,
      targetRepositoryId,
    }: GitHubContentDirectoryMutationVariables) =>
      dashboardOrpc.integrations.repositories.contentDirectory.update.call({
        organizationId,
        repositoryId: targetRepositoryId,
        contentType,
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
                contentType,
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
            contentType,
          },
        }),
        result
      );
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success(`${contentLabel} folder saved`);
    },
    onError: (error) => {
      toast.error(error.message || `Failed to save ${contentLabel} folder`);
    },
  });
  const outputMutation = useMutation({
    mutationFn: ({ enabled, outputId }: GitHubOutputMutationVariables) =>
      outputId
        ? dashboardOrpc.integrations.outputs.update.call({
            organizationId,
            outputId,
            enabled,
          })
        : dashboardOrpc.integrations.repositories.configureOutput.call({
            organizationId,
            repositoryId,
            outputType: contentType,
            enabled,
          }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: dashboardOrpc.integrations.list.queryKey({
          input: { organizationId },
        }),
      });
      toast.success(
        variables.enabled
          ? `${contentLabel} publishing resumed`
          : `${contentLabel} publishing paused`
      );
    },
    onError: (error) => {
      toast.error(
        error.message || `Failed to update ${contentLabel} publishing`
      );
    },
  });

  if (!selectedRepository) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contentLabel} publishing</CardTitle>
        <CardDescription>
          Choose where each repository stores generated {pluralLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup
          aria-label={`${contentLabel} repository`}
          className="bg-muted flex max-w-full grid-cols-none gap-1 overflow-x-auto rounded-lg p-[3px]"
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
                className="text-foreground/60 hover:text-foreground has-data-checked:bg-background has-data-checked:text-foreground has-[:focus-visible]:ring-ring flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-transparent px-2 text-sm font-medium transition-colors has-data-checked:shadow-sm has-[:focus-visible]:ring-2"
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

        <div className="flex max-w-xl items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Publish {pluralLabel}</p>
            <p className="text-muted-foreground text-xs">
              {publishingEnabled
                ? `Create draft pull requests from ${pluralLabel}.`
                : "Publishing is off. Turn it on to resume."}
            </p>
          </div>
          <Switch
            aria-label={`Publish ${pluralLabel}`}
            checked={publishingEnabled}
            disabled={outputMutation.isPending}
            onCheckedChange={(enabled) => {
              outputMutation.mutate({
                enabled,
                outputId: contentOutput?.id,
              });
            }}
          />
        </div>

        <Field className="max-w-xl">
          <FieldLabel htmlFor={folderTriggerId}>
            {contentLabel} folder
          </FieldLabel>
          {directoryQuery.isError && !directoryQuery.data ? (
            <div
              className="border-destructive/30 flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3"
              role="alert"
            >
              <p className="text-destructive text-sm">
                Unable to load the {contentLabel} folder.
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
              contentLabel={contentLabel}
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

export function GitHubPublishingSettings(props: GitHubPublishingSettingsProps) {
  return (
    <>
      <GitHubContentPublishingSettings
        {...props}
        contentLabel="Changelog"
        contentType="changelog"
        pluralLabel="changelogs"
      />
      <GitHubContentPublishingSettings
        {...props}
        contentLabel="Blog post"
        contentType="blog_post"
        pluralLabel="blog posts"
      />
    </>
  );
}
