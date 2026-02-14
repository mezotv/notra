"use client";

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
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@notra/ui/components/ui/sheet";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { GitHubIntegration } from "@/types/integrations";
import type { Trigger } from "@/types/triggers";
import { QUERY_KEYS } from "@/utils/query-keys";
import type {
  LookbackWindow,
  OutputContentType,
  WebhookEventType,
} from "@/utils/schemas/integrations";
import {
  LOOKBACK_WINDOWS,
  MAX_SCHEDULE_NAME_LENGTH,
} from "@/utils/schemas/integrations";
import { SchedulePicker } from "./trigger-schedule-picker";

const EVENT_OPTIONS: Array<{ value: WebhookEventType; label: string }> = [
  { value: "release", label: "Release published" },
  { value: "push", label: "Push to default branch" },
  { value: "star", label: "New star" },
];

const OUTPUT_OPTIONS: Array<{
  value: OutputContentType;
  label: string;
  disabled?: boolean;
}> = [
  { value: "changelog", label: "Changelog" },
  { value: "blog_post", label: "Blog Post", disabled: true },
  { value: "twitter_post", label: "Twitter Post", disabled: true },
  { value: "linkedin_post", label: "LinkedIn Post", disabled: true },
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
}

const LOOKBACK_WINDOW_LABELS: Record<LookbackWindow, string> = {
  current_day: "Current day",
  yesterday: "Yesterday",
  last_7_days: "Last 7 days",
  last_14_days: "Last 14 days",
  last_30_days: "Last 30 days",
};

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
  apiPath?: string;
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
  apiPath,
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
        eventType:
          (editTrigger.sourceConfig.eventTypes?.[0] as WebhookEventType) ??
          "release",
        outputType: editTrigger.outputType as OutputContentType,
        repositoryIds: editTrigger.targets.repositoryIds,
        schedule: editTrigger.sourceConfig.cron ?? {
          frequency: "daily",
          hour: 9,
          minute: 0,
        },
        lookbackWindow: editTrigger.lookbackWindow ?? "last_7_days",
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
    };
  }, [defaultSourceType, editTrigger]);

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const { data: integrationsResponse, isLoading: isLoadingRepos } = useQuery({
    queryKey: QUERY_KEYS.INTEGRATIONS.all(organizationId),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${organizationId}/integrations`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch integrations");
      }

      return response.json() as Promise<{
        integrations: Array<GitHubIntegration & { type: string }>;
      }>;
    },
    enabled: !!organizationId,
  });

  const repositories = useMemo(
    () =>
      integrationsResponse?.integrations
        .filter((integration) => integration.type === "github")
        .flatMap((integration) => integration.repositories) ?? [],
    [integrationsResponse]
  );

  const repositoryOptions = useMemo(
    () =>
      repositories.map((repo) => ({
        value: repo.id,
        label: `${repo.owner}/${repo.repo}`,
      })),
    [repositories]
  );

  const mutation = useMutation({
    mutationFn: async (value: TriggerFormValues) => {
      const basePath =
        apiPath ?? `/api/organizations/${organizationId}/triggers`;
      const targetPath = isEditMode
        ? `${basePath}?triggerId=${editTrigger.id}`
        : basePath;
      const response = await fetch(targetPath, {
        method: isEditMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: value.name,
          sourceType: value.sourceType,
          sourceConfig:
            value.sourceType === "cron"
              ? { cron: value.schedule }
              : { eventTypes: [value.eventType] },
          targets: { repositoryIds: value.repositoryIds },
          outputType: value.outputType,
          ...(value.sourceType === "cron"
            ? { lookbackWindow: value.lookbackWindow }
            : {}),
          outputConfig: {},
          enabled: isEditMode ? editTrigger.enabled : true,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.code === "DUPLICATE_TRIGGER") {
          throw new Error(
            isScheduleContext
              ? "Schedule already exists"
              : "Trigger already exists"
          );
        }
        throw new Error(
          payload?.error ??
            (isEditMode
              ? "Failed to update schedule"
              : isScheduleContext
                ? "Failed to create schedule"
                : "Failed to create trigger")
        );
      }

      return payload as { trigger: Trigger };
    },
    onSuccess: (data) => {
      toast.success(
        isEditMode
          ? "Schedule updated"
          : isScheduleContext
            ? "Schedule added"
            : "Trigger added"
      );
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
      <SheetContent className="gap-0 overflow-hidden sm:max-w-lg" side="right">
        <SheetHeader className="shrink-0 border-b">
          <SheetTitle className="text-2xl">
            {isEditMode
              ? "Edit Schedule"
              : isScheduleContext
                ? "Add Schedule"
                : "Add Trigger"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update the schedule configuration."
              : isScheduleContext
                ? "Configure when and how to generate content automatically."
                : "Choose a source, targets, and output to automate content."}
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
                            availableSourceOptions[0]?.label ?? "GitHub webhook"
                          }
                        />
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            if (value) {
                              field.handleChange(
                                value as Trigger["sourceType"]
                              );
                            }
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
                            <Label htmlFor={field.name}>Lookback window</Label>
                            <Select
                              onValueChange={(value) => {
                                if (value) {
                                  field.handleChange(value as LookbackWindow);
                                }
                              }}
                              value={field.state.value}
                            >
                              <SelectTrigger className="w-full" id={field.name}>
                                <SelectValue placeholder="Lookback window">
                                  {LOOKBACK_WINDOW_LABELS[field.state.value]}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {LOOKBACK_WINDOWS.map((window) => (
                                  <SelectItem key={window} value={window}>
                                    {LOOKBACK_WINDOW_LABELS[window]}
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
                              if (value) {
                                field.handleChange(value as WebhookEventType);
                              }
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
                      <RequiredLabel>Targets</RequiredLabel>
                    </Label>
                    {isLoadingRepos ? (
                      <Skeleton className="h-10 w-full" />
                    ) : repositories.length === 0 ? (
                      <div className="rounded-md border border-dashed p-3 text-muted-foreground text-xs">
                        Add a GitHub repository first to select targets.
                      </div>
                    ) : (
                      <div ref={comboboxAnchor}>
                        <Combobox
                          items={repositoryOptions.map((repo) => repo.value)}
                          multiple
                          onValueChange={(value) =>
                            field.handleChange(
                              Array.isArray(value) ? value : []
                            )
                          }
                          value={field.state.value}
                        >
                          <ComboboxChips>
                            {field.state.value.map((repoId) => {
                              const repo = repositoryOptions.find(
                                (option) => option.value === repoId
                              );
                              if (!repo) {
                                return null;
                              }
                              return (
                                <ComboboxChip key={repo.value}>
                                  {repo.label}
                                </ComboboxChip>
                              );
                            })}
                            <ComboboxChipsInput placeholder="Search repositories" />
                          </ComboboxChips>
                          <ComboboxContent anchor={comboboxAnchor.current}>
                            <ComboboxEmpty>
                              No repositories found.
                            </ComboboxEmpty>
                            <ComboboxList>
                              {repositoryOptions.map((repo) => (
                                <ComboboxItem
                                  key={repo.value}
                                  value={repo.value}
                                >
                                  {repo.label}
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Pick one or more repositories.
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
                        if (value) {
                          field.handleChange(value as OutputContentType);
                        }
                      }}
                      value={field.state.value}
                    >
                      <SelectTrigger className="w-full" id={field.name}>
                        <SelectValue placeholder="Output">
                          {
                            OUTPUT_OPTIONS.find(
                              (o) => o.value === field.state.value
                            )?.label
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {OUTPUT_OPTIONS.map((option) => (
                          <SelectItem
                            disabled={option.disabled}
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                            {option.disabled ? " (Coming soon)" : ""}
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
            </div>
          </ScrollArea>

          <SheetFooter className="shrink-0 border-t bg-background pt-4">
            <SheetClose render={<Button variant="outline">Cancel</Button>} />
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
                  {isSubmitting
                    ? isEditMode
                      ? "Saving..."
                      : "Adding..."
                    : isEditMode
                      ? "Save changes"
                      : isScheduleContext
                        ? "Add schedule"
                        : "Add trigger"}
                </Button>
              )}
            </form.Subscribe>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
