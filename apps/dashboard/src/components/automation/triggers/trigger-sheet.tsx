"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@notra/ui/components/ui/combobox";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { ScrollArea } from "@notra/ui/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@notra/ui/components/ui/sheet";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandVoiceCombobox } from "@/components/brand-voice-combobox";
import { AddIntegrationDialog } from "@/components/integrations/add-integration-dialog";
import { AddRepositoryButton } from "@/components/integrations/add-repository-button";
import { AddRepositoryDialog } from "@/components/integrations/add-repository-dialog";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  LookbackWindow,
  OutputContentType,
  WebhookEventType,
} from "@/schemas/integrations";
import {
  LOOKBACK_WINDOWS,
  MAX_SCHEDULE_NAME_LENGTH,
} from "@/schemas/integrations";
import type { BrandSettings } from "@/types/hooks/brand-analysis";
import type { GitHubIntegration } from "@/types/integrations";
import type { Trigger } from "@/types/triggers/triggers";
import { formatSnakeCaseLabel } from "@/utils/format";
import { OutputTypeIcon } from "@/utils/output-types";
import { SchedulePicker } from "./trigger-schedule-picker";

const EVENT_OPTIONS: Array<{ value: WebhookEventType; label: string }> = [
  { value: "release", label: "Release published" },
  { value: "push", label: "Push to default branch" },
];

const OUTPUT_OPTIONS: Array<{
  value: OutputContentType;
  label: string;
  disabled?: boolean;
}> = [
  { value: "changelog", label: "Changelog" },
  { value: "linkedin_post", label: "LinkedIn Post" },
  { value: "blog_post", label: "Blog Post" },
  { value: "twitter_post", label: "Twitter Post" },
  { value: "investor_update", label: "Investor Update", disabled: true },
];

interface TriggerFormValues {
  name: string;
  sourceType: Trigger["sourceType"];
  eventType: WebhookEventType;
  outputType: OutputContentType;
  repositoryIds: string[];
  schedule: Trigger["sourceConfig"]["cron"];
  lookbackWindow: LookbackWindow;
  brandVoiceId: string;
  autoPublish: boolean;
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children}
      <span aria-hidden="true" className="ml-0.5 text-destructive">
        *
      </span>
    </span>
  );
}

interface TriggerDialogProps {
  organizationId: string;
  onSuccess?: (trigger: Trigger) => void;
  trigger?: React.ReactElement;
  allowedSourceTypes?: Trigger["sourceType"][];
  initialSourceType?: Trigger["sourceType"];
  editTrigger?: Trigger;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTriggerDialog({
  organizationId,
  onSuccess,
  trigger,
  allowedSourceTypes,
  initialSourceType,
  editTrigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TriggerDialogProps) {
  const isEditMode = !!editTrigger;
  const isScheduleContext =
    initialSourceType === "cron" ||
    (allowedSourceTypes?.length === 1 && allowedSourceTypes[0] === "cron");
  const sourceOptions: Array<{
    value: Trigger["sourceType"];
    label: string;
  }> = [
    { value: "github_webhook", label: "GitHub webhook" },
    { value: "cron", label: "Schedule" },
  ];
  const availableSourceTypes =
    allowedSourceTypes ?? sourceOptions.map((option) => option.value);
  const availableSourceOptions = sourceOptions.filter((option) =>
    availableSourceTypes.includes(option.value)
  );
  const isSourceLocked = availableSourceOptions.length === 1;
  const defaultSourceType =
    initialSourceType && availableSourceTypes.includes(initialSourceType)
      ? initialSourceType
      : (availableSourceOptions[0]?.value ?? "github_webhook");

  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (controlledOnOpenChange ?? (() => {}))
    : setInternalOpen;
  const comboboxAnchor = useComboboxAnchor();

  const getDefaultValues = useCallback((): TriggerFormValues => {
    if (editTrigger) {
      return {
        name: editTrigger.name ?? "Untitled Schedule",
        sourceType: editTrigger.sourceType,
        eventType: editTrigger.sourceConfig.eventTypes?.[0] ?? "release",
        outputType: editTrigger.outputType,
        repositoryIds: editTrigger.targets.repositoryIds,
        schedule: editTrigger.sourceConfig.cron ?? {
          frequency: "daily",
          hour: 9,
          minute: 0,
        },
        lookbackWindow: editTrigger.lookbackWindow ?? "last_7_days",
        brandVoiceId:
          editTrigger.outputConfig?.brandVoiceId &&
          editTrigger.outputConfig.brandVoiceId !== "__default__"
            ? editTrigger.outputConfig.brandVoiceId
            : "",
        autoPublish: editTrigger.autoPublish ?? false,
      };
    }
    return {
      name: "",
      sourceType: defaultSourceType,
      eventType: "release",
      outputType: "changelog",
      repositoryIds: [],
      schedule: { frequency: "daily", hour: 9, minute: 0 },
      lookbackWindow: "last_7_days",
      brandVoiceId: "",
      autoPublish: false,
    };
  }, [defaultSourceType, editTrigger]);

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const { data: integrationsResponse, isLoading: isLoadingRepos } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );

  const { data: brandResponse } = useQuery(
    dashboardOrpc.brand.voices.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId,
    })
  );

  const brandVoices = brandResponse?.voices ?? [];

  const { repositories, integrationOptions, githubIntegrationId } =
    useMemo(() => {
      const githubIntegrations =
        integrationsResponse?.integrations.filter(
          (integration) => integration.type === "github" && integration.enabled
        ) ?? [];
      const linearIntegrations =
        integrationsResponse?.integrations.filter(
          (integration) => integration.type === "linear" && integration.enabled
        ) ?? [];
      const repos = githubIntegrations.flatMap((integration) =>
        integration.repositories.filter((r) => r.enabled)
      );

      const options: Array<{
        value: string;
        label: string;
        type: "github" | "linear";
      }> = [
        ...repos.map((r) => ({
          value: r.id,
          label: r.defaultBranch
            ? `${r.owner}/${r.repo} · ${r.defaultBranch}`
            : `${r.owner}/${r.repo}`,
          type: "github" as const,
        })),
        ...linearIntegrations.map((i) => ({
          value: `linear:${i.id}`,
          label: i.displayName,
          type: "linear" as const,
        })),
      ];

      return {
        repositories: repos,
        integrationOptions: options,
        githubIntegrationId: githubIntegrations[0]?.id,
      };
    }, [integrationsResponse]);

  const mutation = useMutation<{ trigger: Trigger }, Error, TriggerFormValues>({
    mutationFn: async (value) => {
      try {
        if (value.sourceType === "cron") {
          if (value.outputType === "investor_update") {
            throw new Error("Investor updates are not supported for schedules");
          }

          if (!value.schedule) {
            throw new Error("Schedule configuration is required");
          }

          const githubRepoIds = value.repositoryIds.filter(
            (id) => !id.startsWith("linear:")
          );

          const schedulePayload = {
            organizationId,
            name: value.name,
            sourceType: "cron" as const,
            sourceConfig: { cron: value.schedule },
            targets: { repositoryIds: githubRepoIds },
            outputType: value.outputType,
            outputConfig: {
              ...(value.brandVoiceId
                ? { brandVoiceId: value.brandVoiceId }
                : {}),
            },
            enabled: isEditMode ? editTrigger.enabled : true,
            autoPublish: value.autoPublish,
            lookbackWindow: value.lookbackWindow,
          };

          if (isEditMode) {
            return await dashboardOrpc.automation.schedules.update.call({
              triggerId: editTrigger.id,
              ...schedulePayload,
            });
          }

          return await dashboardOrpc.automation.schedules.create.call(
            schedulePayload
          );
        }

        const eventRepoIds = value.repositoryIds.filter(
          (id) => !id.startsWith("linear:")
        );

        const eventPayload = {
          organizationId,
          sourceType: "github_webhook" as const,
          sourceConfig: { eventTypes: [value.eventType] },
          targets: { repositoryIds: eventRepoIds },
          outputType: value.outputType,
          outputConfig: {
            ...(value.brandVoiceId ? { brandVoiceId: value.brandVoiceId } : {}),
          },
          enabled: isEditMode ? editTrigger.enabled : true,
          autoPublish: value.autoPublish,
        };

        if (isEditMode) {
          return await dashboardOrpc.automation.events.update.call({
            triggerId: editTrigger.id,
            ...eventPayload,
          });
        }

        return await dashboardOrpc.automation.events.create.call(eventPayload);
      } catch (error) {
        if (error instanceof Error && error.message === "Duplicate trigger") {
          throw new Error(
            isScheduleContext
              ? "Schedule already exists"
              : "Trigger already exists"
          );
        }

        if (error instanceof Error && error.message) {
          throw error;
        }

        if (isEditMode) {
          throw new Error("Failed to update schedule");
        }

        throw new Error(
          isScheduleContext
            ? "Failed to create schedule"
            : "Failed to create trigger"
        );
      }
    },
    onSuccess: (data) => {
      let successMessage: string;

      if (isEditMode) {
        successMessage = "Schedule updated";
      } else if (isScheduleContext) {
        successMessage = "Schedule added";
      } else {
        successMessage = "Trigger added";
      }

      toast.success(successMessage);
      onSuccess?.(data.trigger);
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        form.reset();
      }
    },
    [form, setOpen]
  );

  return (
    <>
      <Sheet onOpenChange={handleOpenChange} open={open}>
        {trigger ? (
          <SheetTrigger render={trigger} />
        ) : (
          <SheetTrigger
            render={
              <Button size="sm" variant="outline">
                New trigger
              </Button>
            }
          />
        )}
        <SheetContent
          className="gap-0 overflow-hidden sm:max-w-lg"
          side="right"
        >
          <SheetHeader className="shrink-0 border-b">
            <SheetTitle className="text-2xl">
              {isEditMode && "Edit Schedule"}
              {!isEditMode &&
                (isScheduleContext ? "Add Schedule" : "Add Event Trigger")}
            </SheetTitle>
            <SheetDescription>
              {isEditMode && "Update the schedule configuration."}
              {!isEditMode &&
                (isScheduleContext
                  ? "Configure when and how to generate content automatically."
                  : "Choose a source, targets, and output to automate content.")}
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-4 px-4 py-4 pb-6">
                <form.Field name="sourceType">
                  {(field) =>
                    isScheduleContext ? null : (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>
                          <RequiredLabel>Source</RequiredLabel>
                        </Label>
                        {isSourceLocked ? (
                          <Input
                            disabled
                            id={field.name}
                            value={
                              availableSourceOptions[0]?.label ??
                              "GitHub webhook"
                            }
                          />
                        ) : (
                          <Select
                            onValueChange={(value) => {
                              if (!value) {
                                return;
                              }
                              field.handleChange(value);
                            }}
                            value={field.state.value}
                          >
                            <SelectTrigger className="w-full" id={field.name}>
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSourceOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  }
                </form.Field>

                <form.Subscribe selector={(state) => state.values.sourceType}>
                  {(sourceType) =>
                    sourceType === "cron" ? (
                      <>
                        <form.Field name="name">
                          {(field) => (
                            <div className="space-y-2">
                              <Label htmlFor={field.name}>
                                <RequiredLabel>Name</RequiredLabel>
                              </Label>
                              <Input
                                id={field.name}
                                maxLength={MAX_SCHEDULE_NAME_LENGTH}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder="Weekly changelog"
                                value={field.state.value}
                              />
                            </div>
                          )}
                        </form.Field>

                        <form.Field name="schedule">
                          {(field) => (
                            <SchedulePicker
                              onChange={field.handleChange}
                              value={field.state.value}
                            />
                          )}
                        </form.Field>

                        <form.Field name="lookbackWindow">
                          {(field) => (
                            <div className="space-y-2">
                              <Label htmlFor={field.name}>
                                Lookback window
                              </Label>
                              <Select
                                onValueChange={(value) => {
                                  if (!value) {
                                    return;
                                  }
                                  field.handleChange(value);
                                }}
                                value={field.state.value}
                              >
                                <SelectTrigger
                                  className="w-full"
                                  id={field.name}
                                >
                                  <SelectValue placeholder="Lookback window">
                                    <span className="capitalize">
                                      {formatSnakeCaseLabel(field.state.value)}
                                    </span>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {LOOKBACK_WINDOWS.map((window) => (
                                    <SelectItem key={window} value={window}>
                                      <span className="capitalize">
                                        {formatSnakeCaseLabel(window)}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-muted-foreground text-xs">
                                Choose how far back we look when generating
                                content.
                              </p>
                            </div>
                          )}
                        </form.Field>

                        {brandVoices.length > 1 && (
                          <form.Field name="brandVoiceId">
                            {(field) => (
                              <BrandVoiceCombobox
                                id={field.name}
                                onChange={field.handleChange}
                                value={field.state.value}
                                voices={brandVoices}
                              />
                            )}
                          </form.Field>
                        )}
                      </>
                    ) : (
                      <form.Field name="eventType">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>
                              <RequiredLabel>Event</RequiredLabel>
                            </Label>
                            <Select
                              onValueChange={(value) => {
                                if (!value) {
                                  return;
                                }
                                field.handleChange(value);
                              }}
                              value={field.state.value}
                            >
                              <SelectTrigger className="w-full" id={field.name}>
                                <SelectValue placeholder="Event">
                                  {
                                    EVENT_OPTIONS.find(
                                      (o) => o.value === field.state.value
                                    )?.label
                                  }
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {EVENT_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </form.Field>
                    )
                  }
                </form.Subscribe>

                <form.Field name="repositoryIds">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        <RequiredLabel>Integrations</RequiredLabel>
                      </Label>
                      {isLoadingRepos && <Skeleton className="h-10 w-full" />}
                      {!isLoadingRepos && integrationOptions.length === 0 && (
                        <div className="flex items-center gap-2 rounded-md border border-dashed p-3">
                          <span className="flex-1 text-muted-foreground text-xs">
                            No integrations connected.
                          </span>
                          <AddRepositoryButton
                            onAdd={() => {
                              setOpen(false);
                              setAddRepoOpen(true);
                            }}
                          />
                        </div>
                      )}
                      {!isLoadingRepos && integrationOptions.length > 0 && (
                        <div ref={comboboxAnchor}>
                          <Combobox
                            items={integrationOptions.map((o) => o.value)}
                            multiple
                            onValueChange={(value) =>
                              field.handleChange(
                                Array.isArray(value) ? value : []
                              )
                            }
                            value={field.state.value}
                          >
                            <ComboboxChips>
                              {field.state.value.map((id) => {
                                const opt = integrationOptions.find(
                                  (o) => o.value === id
                                );
                                if (!opt) {
                                  return null;
                                }
                                return (
                                  <ComboboxChip key={opt.value}>
                                    <span className="flex items-center gap-1.5">
                                      {opt.type === "github" ? (
                                        <Github className="size-3 shrink-0" />
                                      ) : (
                                        <Linear className="size-3 shrink-0" />
                                      )}
                                      {opt.label}
                                    </span>
                                  </ComboboxChip>
                                );
                              })}
                              <ComboboxChipsInput placeholder="Search integrations" />
                            </ComboboxChips>
                            <ComboboxContent anchor={comboboxAnchor.current}>
                              <ComboboxEmpty>
                                No integrations found.
                              </ComboboxEmpty>
                              <ComboboxList>
                                {integrationOptions.map((opt) => (
                                  <ComboboxItem
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    <span className="flex items-center gap-2">
                                      {opt.type === "github" ? (
                                        <Github className="size-3.5 shrink-0" />
                                      ) : (
                                        <Linear className="size-3.5 shrink-0" />
                                      )}
                                      {opt.label}
                                    </span>
                                  </ComboboxItem>
                                ))}
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        </div>
                      )}
                      <p className="text-muted-foreground text-xs">
                        Pick one or more integrations.
                      </p>
                    </div>
                  )}
                </form.Field>

                <form.Field name="outputType">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        <RequiredLabel>Output</RequiredLabel>
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          if (!value) {
                            return;
                          }
                          field.handleChange(value);
                        }}
                        value={field.state.value}
                      >
                        <SelectTrigger className="w-full" id={field.name}>
                          <SelectValue placeholder="Output">
                            <span className="flex items-center gap-2">
                              <OutputTypeIcon
                                className="size-4"
                                outputType={field.state.value}
                              />
                              {
                                OUTPUT_OPTIONS.find(
                                  (o) => o.value === field.state.value
                                )?.label
                              }
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {OUTPUT_OPTIONS.map((option) => (
                            <SelectItem
                              disabled={option.disabled}
                              key={option.value}
                              value={option.value}
                            >
                              <span className="flex items-center gap-2">
                                <OutputTypeIcon
                                  className="size-4"
                                  outputType={option.value}
                                />
                                {option.label}
                                {option.disabled ? " (Coming soon)" : ""}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <div className="space-y-2">
                  <Label>Publish destination</Label>
                  <Input disabled placeholder="Coming soon (Webflow, Framer)" />
                </div>

                <form.Field name="autoPublish">
                  {(field) => (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-1.5">
                        <Label
                          className="cursor-pointer font-medium text-sm"
                          htmlFor={field.name}
                        >
                          Instant publish
                        </Label>
                        <Tooltip>
                          <TooltipTrigger className="inline-flex cursor-help text-muted-foreground">
                            <HugeiconsIcon
                              icon={InformationCircleIcon}
                              size={14}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="max-w-50 text-xs">
                              When enabled, generated posts are published to the
                              API immediately instead of saved as drafts.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={field.state.value}
                        id={field.name}
                        onCheckedChange={field.handleChange}
                      />
                    </div>
                  )}
                </form.Field>
              </div>
            </ScrollArea>

            <SheetFooter className="shrink-0 border-t bg-background pt-4">
              <form.Subscribe
                selector={(state) => ({
                  canSubmit:
                    state.values.repositoryIds.length > 0 &&
                    (state.values.sourceType !== "cron" ||
                      state.values.name.trim().length > 0) &&
                    (state.values.sourceType !== "cron" ||
                      state.values.schedule?.frequency),
                  isSubmitting: mutation.isPending,
                })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button disabled={isSubmitting || !canSubmit} type="submit">
                    {(() => {
                      if (isSubmitting) {
                        return isEditMode ? "Saving..." : "Adding...";
                      }

                      if (isEditMode) {
                        return "Save changes";
                      }

                      if (isScheduleContext) {
                        return "Add schedule";
                      }

                      return "Add trigger";
                    })()}
                  </Button>
                )}
              </form.Subscribe>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      {githubIntegrationId ? (
        <AddRepositoryDialog
          integrationId={githubIntegrationId}
          onOpenChange={(isOpen) => {
            setAddRepoOpen(isOpen);
            if (!isOpen) {
              setOpen(true);
            }
          }}
          open={addRepoOpen}
          organizationId={organizationId}
        />
      ) : (
        <AddIntegrationDialog
          onOpenChange={(isOpen) => {
            setAddRepoOpen(isOpen);
            if (!isOpen) {
              setOpen(true);
            }
          }}
          open={addRepoOpen}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
