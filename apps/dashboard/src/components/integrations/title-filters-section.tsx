"use client";

import {
  Add01Icon,
  Delete02Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import {
  GITHUB_TITLE_FILTER_PRESETS,
  LINEAR_TITLE_FILTER_PRESETS,
  TITLE_FILTER_MATCH_TYPE_OPTIONS,
} from "@/constants/title-filters";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  type CreateTitleFilterBody,
  isValidTitleFilterRegex,
  MAX_TITLE_FILTER_PATTERN_LENGTH,
  type TitleFilterMatchType,
} from "@/schemas/title-filters";
import type {
  TitleFilter,
  TitleFilterAddFormProps,
  TitleFilterPreset,
  TitleFilterPresetListProps,
  TitleFilterRowProps,
  TitleFiltersSectionProps,
} from "@/types/title-filters";

function getPresetForFilter(filter: TitleFilter, presets: TitleFilterPreset[]) {
  return presets.find(
    (preset) =>
      preset.matchType === filter.matchType && preset.pattern === filter.pattern
  );
}

function TitleFilterAddForm({
  matchType,
  pattern,
  patternError,
  isPending,
  onMatchTypeChange,
  onPatternChange,
  onSubmit,
}: TitleFilterAddFormProps) {
  return (
    <div className="space-y-1.5">
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
        <Select onValueChange={onMatchTypeChange} value={matchType}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue className="capitalize" />
          </SelectTrigger>
          <SelectContent>
            {TITLE_FILTER_MATCH_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-invalid={patternError ? true : undefined}
          aria-label="Filter pattern"
          className="flex-1 font-mono text-xs"
          maxLength={MAX_TITLE_FILTER_PATTERN_LENGTH}
          onChange={(event) => onPatternChange(event.target.value)}
          placeholder={matchType === "regex" ? "^docs(\\(.*\\))?:" : "docs:"}
          value={pattern}
        />
        <Button disabled={isPending} size="sm" type="submit" variant="outline">
          {isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <HugeiconsIcon className="size-3.5" icon={Add01Icon} />
          )}
          <span className="ml-1">Add filter</span>
        </Button>
      </form>
      {patternError && (
        <p className="text-destructive text-xs">{patternError}</p>
      )}
    </div>
  );
}

function TitleFilterPresetList({
  presets,
  disabled,
  onAdd,
}: TitleFilterPresetListProps) {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <p className="font-medium text-muted-foreground text-xs">Suggestions</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((preset) => (
          <Tooltip key={preset.id}>
            <TooltipTrigger
              render={
                <Button
                  className="h-7 rounded-full px-3 text-xs"
                  disabled={disabled}
                  onClick={() => onAdd(preset)}
                  size="sm"
                  type="button"
                  variant="outline"
                />
              }
            >
              <HugeiconsIcon className="size-3" icon={Add01Icon} />
              {preset.label}
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{preset.description}</p>
              <p className="mt-1 font-mono text-xs opacity-80">
                {preset.pattern}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function TitleFilterRow({
  filter,
  presetLabel,
  updatePending,
  deletePending,
  onToggle,
  onPatternSave,
  onDelete,
}: TitleFilterRowProps) {
  const [value, setValue] = useState(filter.pattern);
  const [invalid, setInvalid] = useState(false);

  const inlineLabel =
    presetLabel ?? (filter.matchType === "contains" ? "Text match" : "Regex");

  const commit = () => {
    const trimmed = value.trim();

    if (!trimmed || trimmed === filter.pattern) {
      setValue(filter.pattern);
      setInvalid(false);
      return;
    }

    if (filter.matchType === "regex" && !isValidTitleFilterRegex(trimmed)) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    onPatternSave(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      setValue(filter.pattern);
      setInvalid(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            aria-invalid={invalid ? true : undefined}
            aria-label={`Filter pattern ${filter.pattern}`}
            className={`w-full pr-24 font-mono text-xs ${filter.enabled ? "" : "opacity-60"}`}
            disabled={updatePending}
            maxLength={MAX_TITLE_FILTER_PATTERN_LENGTH}
            onBlur={commit}
            onChange={(event) => {
              setValue(event.target.value);
              setInvalid(false);
            }}
            onKeyDown={handleKeyDown}
            value={value}
          />
          {value === filter.pattern && (
            <span className="pointer-events-none absolute inset-y-0 right-3 hidden items-center text-muted-foreground text-xs sm:flex">
              {inlineLabel}
            </span>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Switch
                aria-label={`Toggle filter ${filter.pattern}`}
                checked={filter.enabled}
                disabled={updatePending}
                onCheckedChange={onToggle}
                size="sm"
              />
            }
          />
          <TooltipContent>
            {filter.enabled ? "Active" : "Paused"}
          </TooltipContent>
        </Tooltip>
        <Button
          aria-label={`Delete filter ${filter.pattern}`}
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          disabled={deletePending}
          onClick={onDelete}
          size="icon"
          type="button"
          variant="ghost"
        >
          <HugeiconsIcon className="size-3.5" icon={Delete02Icon} />
        </Button>
      </div>
      {invalid && (
        <p className="text-destructive text-xs">
          Enter a valid regular expression
        </p>
      )}
    </div>
  );
}

export function TitleFiltersSection({
  source,
  organizationId,
  targetId,
  targetLabel,
}: TitleFiltersSectionProps) {
  const queryClient = useQueryClient();
  const isGithub = source === "github";
  const presets = isGithub
    ? GITHUB_TITLE_FILTER_PRESETS
    : LINEAR_TITLE_FILTER_PRESETS;

  const [matchType, setMatchType] = useState<TitleFilterMatchType>("contains");
  const [pattern, setPattern] = useState("");
  const [patternError, setPatternError] = useState<string | null>(null);

  const listQueryKey = isGithub
    ? dashboardOrpc.integrations.repositories.titleFilters.list.queryKey({
        input: { organizationId, repositoryId: targetId },
      })
    : dashboardOrpc.integrations.linear.titleFilters.list.queryKey({
        input: { organizationId, integrationId: targetId },
      });

  const { data, isLoading, isError } = useQuery(
    isGithub
      ? dashboardOrpc.integrations.repositories.titleFilters.list.queryOptions({
          input: { organizationId, repositoryId: targetId },
        })
      : dashboardOrpc.integrations.linear.titleFilters.list.queryOptions({
          input: { organizationId, integrationId: targetId },
        })
  );

  const filters = data?.filters ?? [];

  const createMutation = useMutation<TitleFilter, Error, CreateTitleFilterBody>(
    {
      mutationFn: (body) =>
        isGithub
          ? dashboardOrpc.integrations.repositories.titleFilters.create.call({
              organizationId,
              repositoryId: targetId,
              ...body,
            })
          : dashboardOrpc.integrations.linear.titleFilters.create.call({
              organizationId,
              integrationId: targetId,
              ...body,
            }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: listQueryKey });
        setPattern("");
        setPatternError(null);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  const updateMutation = useMutation<
    TitleFilter,
    Error,
    {
      filterId: string;
      enabled?: boolean;
      matchType?: TitleFilterMatchType;
      pattern?: string;
    }
  >({
    mutationFn: (body) =>
      isGithub
        ? dashboardOrpc.integrations.repositories.titleFilters.update.call({
            organizationId,
            repositoryId: targetId,
            ...body,
          })
        : dashboardOrpc.integrations.linear.titleFilters.update.call({
            organizationId,
            integrationId: targetId,
            ...body,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
    onError: (error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });

  const deleteMutation = useMutation<
    { success: boolean },
    Error,
    { filterId: string }
  >({
    mutationFn: ({ filterId }) =>
      isGithub
        ? dashboardOrpc.integrations.repositories.titleFilters.delete.call({
            organizationId,
            repositoryId: targetId,
            filterId,
          })
        : dashboardOrpc.integrations.linear.titleFilters.delete.call({
            organizationId,
            integrationId: targetId,
            filterId,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPattern = pattern.trim();
    if (!trimmedPattern) {
      setPatternError("Enter a pattern first");
      return;
    }

    if (matchType === "regex" && !isValidTitleFilterRegex(trimmedPattern)) {
      setPatternError("Enter a valid regular expression");
      return;
    }

    setPatternError(null);
    createMutation.mutate({ matchType, pattern: trimmedPattern });
  };

  const handleMatchTypeChange = (value: TitleFilterMatchType | null) => {
    if (value) {
      setMatchType(value);
      setPatternError(null);
    }
  };

  const handlePatternChange = (value: string) => {
    setPattern(value);
    if (patternError) {
      setPatternError(null);
    }
  };

  const availablePresets = presets.filter(
    (preset) =>
      !filters.some(
        (filter) =>
          filter.matchType === preset.matchType &&
          filter.pattern === preset.pattern
      )
  );

  const description = isGithub
    ? "Pull requests, commits, and releases matching these patterns are skipped when generating content."
    : "Issues matching these patterns are skipped when generating content.";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <h2 className="font-semibold text-lg">Filters</h2>
          {targetLabel && (
            <span className="text-muted-foreground text-sm">{targetLabel}</span>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  aria-label="About title filters"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  type="button"
                />
              }
            >
              <HugeiconsIcon className="size-4" icon={HelpCircleIcon} />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Titles matching an active filter are skipped. Matching is
              case-insensitive. Click a pattern to edit it.
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {isLoading && <Skeleton className="h-24 w-full rounded-lg" />}

      {!isLoading && isError && (
        <div className="flex items-center justify-center rounded-lg border border-destructive/50 border-dashed p-8 text-destructive text-sm">
          Failed to load title filters.
        </div>
      )}

      {!(isLoading || isError) && (
        <div className="rounded-lg border">
          {filters.length === 0 ? (
            <p className="p-5 text-muted-foreground text-sm">
              No title filters yet. Everything is included. Start with a
              suggestion below or add your own.
            </p>
          ) : (
            <div className="space-y-2.5 p-5">
              {filters.map((filter) => (
                <TitleFilterRow
                  deletePending={deleteMutation.isPending}
                  filter={filter}
                  key={`${filter.id}:${filter.matchType}:${filter.pattern}`}
                  onDelete={() =>
                    deleteMutation.mutate({ filterId: filter.id })
                  }
                  onPatternSave={(nextPattern) =>
                    updateMutation.mutate({
                      filterId: filter.id,
                      matchType: filter.matchType,
                      pattern: nextPattern,
                    })
                  }
                  onToggle={(enabled) =>
                    updateMutation.mutate({ filterId: filter.id, enabled })
                  }
                  presetLabel={getPresetForFilter(filter, presets)?.label}
                  updatePending={updateMutation.isPending}
                />
              ))}
            </div>
          )}

          <div className="space-y-3 border-t bg-muted/40 p-5">
            <TitleFilterPresetList
              disabled={createMutation.isPending}
              onAdd={(preset) =>
                createMutation.mutate({
                  matchType: preset.matchType,
                  pattern: preset.pattern,
                })
              }
              presets={availablePresets}
            />
            <TitleFilterAddForm
              isPending={createMutation.isPending}
              matchType={matchType}
              onMatchTypeChange={handleMatchTypeChange}
              onPatternChange={handlePatternChange}
              onSubmit={handleAdd}
              pattern={pattern}
              patternError={patternError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
