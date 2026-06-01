"use client";

import {
  Add01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@notra/ui/lib/utils";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BrandIdentityRadioGroup } from "@/components/brand-identity-radio-group";
import { Button } from "@/components/button";
import { FormatCard } from "@/components/content/create/format-card";
import { AddIntegrationDialog } from "@/components/integrations/add-integration-dialog";
import { AddRepositoryButton } from "@/components/integrations/add-repository-button";
import { AddRepositoryDialog } from "@/components/integrations/add-repository-dialog";
import { FORMAT_CARD_META, FORMAT_ORDER } from "@/constants/content-formats";
import { supportsAutoPublish } from "@/constants/schedule-output-types";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  type ScheduleFormValues,
  scheduleFormSchema,
} from "@/schemas/automation/schedule-form";
import {
  LOOKBACK_WINDOWS,
  type LookbackWindow,
  MAX_SCHEDULE_NAME_LENGTH,
} from "@/schemas/integrations";
import type {
  CreateScheduleDialogProps,
  ScheduleCron,
  ScheduleIntegrationOption,
} from "@/types/automation/schedule";
import type { Trigger } from "@/types/triggers/triggers";
import { formatSnakeCaseLabel } from "@/utils/format";
import {
  buildAutoScheduleName,
  formatTimeValue,
  getDefaultScheduleValues,
  parseTimeValue,
} from "@/utils/schedule-form";
import { ScheduleDayPicker } from "./schedule-day-picker";
import { ScheduleFrequencyTabs } from "./schedule-frequency-tabs";
import { ScheduleSummaryCard } from "./schedule-summary-card";

export function CreateScheduleDialog({
  organizationId,
  onSuccess,
  trigger,
  editTrigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateScheduleDialogProps) {
  const isEditMode = !!editTrigger;
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [controlledOnOpenChange, isControlled]
  );

  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const comboboxAnchor = useComboboxAnchor();

  const mutation = useMutation<{ trigger: Trigger }, Error, ScheduleFormValues>(
    {
      mutationFn: async (value) => {
        const githubRepoIds = value.repositoryIds.filter(
          (id) => !id.startsWith("linear:")
        );

        const schedulePayload = {
          organizationId,
          name: value.name.trim(),
          sourceType: "cron" as const,
          sourceConfig: { cron: value.schedule },
          targets: { repositoryIds: githubRepoIds },
          outputType: value.outputType,
          outputConfig: {
            ...(value.brandVoiceId ? { brandVoiceId: value.brandVoiceId } : {}),
          },
          enabled: isEditMode ? editTrigger.enabled : true,
          autoPublish: supportsAutoPublish(value.outputType)
            ? value.autoPublish
            : false,
          lookbackWindow: value.lookbackWindow,
        };

        try {
          if (isEditMode) {
            return await dashboardOrpc.automation.schedules.update.call({
              triggerId: editTrigger.id,
              ...schedulePayload,
            });
          }
          return await dashboardOrpc.automation.schedules.create.call(
            schedulePayload
          );
        } catch (error) {
          if (error instanceof Error && error.message === "Duplicate trigger") {
            throw new Error("Schedule already exists");
          }
          if (error instanceof Error && error.message) {
            throw error;
          }
          throw new Error(
            isEditMode
              ? "Failed to update schedule"
              : "Failed to create schedule"
          );
        }
      },
      onSuccess: (data) => {
        toast.success(isEditMode ? "Schedule updated" : "Schedule added");
        onSuccess?.(data.trigger);
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }
  );

  const form = useForm({
    defaultValues: getDefaultScheduleValues(editTrigger),
    validators: {
      onSubmit: scheduleFormSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  const previousAutoNameRef = useRef("");

  useEffect(() => {
    if (open) {
      form.reset(getDefaultScheduleValues(editTrigger));
      previousAutoNameRef.current = "";
    }
  }, [open, editTrigger, form]);

  const outputType = useStore(form.store, (s) => s.values.outputType);
  const schedule = useStore(form.store, (s) => s.values.schedule);
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = schedule;
  const repositoryCount = useStore(
    form.store,
    (s) => s.values.repositoryIds.length
  );

  useEffect(() => {
    const newAutoName = buildAutoScheduleName(frequency, outputType);
    const currentName = form.state.values.name;
    if (
      currentName === previousAutoNameRef.current ||
      currentName.length === 0
    ) {
      form.setFieldValue("name", newAutoName);
    }
    previousAutoNameRef.current = newAutoName;
  }, [outputType, frequency, form]);

  const { data: integrationsResponse, isLoading: isLoadingRepos } = useQuery(
    dashboardOrpc.integrations.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId && open,
    })
  );

  const { data: brandResponse } = useQuery(
    dashboardOrpc.brand.voices.list.queryOptions({
      input: { organizationId },
      enabled: !!organizationId && open,
    })
  );

  const brandVoices = brandResponse?.voices ?? [];
  const nonDefaultBrandVoices = brandVoices.filter((voice) => !voice.isDefault);
  const defaultBrandVoiceName = brandVoices.find(
    (voice) => voice.isDefault
  )?.name;
  const defaultBrandVoiceLabel = defaultBrandVoiceName
    ? `${defaultBrandVoiceName} (Default)`
    : "Default brand voice";

  const { integrationOptions, githubIntegrationId } = useMemo(() => {
    const githubIntegrations =
      integrationsResponse?.integrations.filter(
        (i) => i.type === "github" && i.enabled
      ) ?? [];
    const linearIntegrations =
      integrationsResponse?.integrations.filter(
        (i) => i.type === "linear" && i.enabled
      ) ?? [];
    const repos = githubIntegrations.flatMap((i) =>
      i.repositories.filter((r) => r.enabled)
    );

    const options: ScheduleIntegrationOption[] = [
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
      integrationOptions: options,
      githubIntegrationId: githubIntegrations[0]?.id,
    };
  }, [integrationsResponse]);

  const handleFrequencyChange = useCallback(
    (next: ScheduleCron["frequency"]) => {
      const prev = form.state.values.schedule;
      let dayOfWeek: number | undefined;
      let dayOfMonth: number | undefined;
      if (next === "weekly") {
        dayOfWeek = prev.dayOfWeek ?? 1;
      } else if (next === "monthly") {
        dayOfMonth = prev.dayOfMonth ?? 1;
      }
      form.setFieldValue("schedule", {
        ...prev,
        frequency: next,
        dayOfWeek,
        dayOfMonth,
      });
    },
    [form]
  );

  const formError = useStore(form.store, (state) => {
    if (state.submissionAttempts === 0) {
      return null;
    }
    for (const meta of Object.values(state.fieldMeta)) {
      const errors = meta?.errors;
      if (errors && errors.length > 0) {
        const first = errors[0];
        if (typeof first === "string") {
          return first;
        }
        if (first && typeof first === "object" && "message" in first) {
          const message = (first as { message: unknown }).message;
          if (typeof message === "string") {
            return message;
          }
        }
      }
    }
    return null;
  });

  return (
    <>
      <ResponsiveDialog onOpenChange={setOpen} open={open}>
        {trigger && <ResponsiveDialogTrigger render={trigger} />}
        <ResponsiveDialogContent className="flex h-[85vh] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <ResponsiveDialogHeader className="shrink-0 border-b p-4 pr-14">
            <ResponsiveDialogTitle className="text-base">
              {isEditMode ? "Edit schedule" : "New schedule"}
            </ResponsiveDialogTitle>
            <p className="text-muted-foreground text-sm">
              Pick a content type, set a schedule, and we'll handle the rest on
              autopilot.
            </p>
          </ResponsiveDialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-8 p-6">
                <section className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">Content format</h3>
                    <p className="text-muted-foreground text-sm">
                      What should we generate?
                    </p>
                  </div>
                  <form.Field name="outputType">
                    {(field) => (
                      <div className="grid gap-3 md:grid-cols-2">
                        {FORMAT_ORDER.map((type) => (
                          <FormatCard
                            format={type}
                            key={type}
                            onToggle={() => field.handleChange(type)}
                            selected={field.state.value === type}
                          />
                        ))}
                      </div>
                    )}
                  </form.Field>
                </section>

                <section className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-1 font-semibold text-base">
                      Name
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Just for you, won't appear in any output.
                    </p>
                  </div>
                  <form.Field name="name">
                    {(field) => (
                      <Input
                        id={field.name}
                        maxLength={MAX_SCHEDULE_NAME_LENGTH}
                        onChange={(event) => {
                          field.handleChange(event.target.value);
                        }}
                        placeholder={buildAutoScheduleName(
                          frequency,
                          outputType
                        )}
                        value={field.state.value}
                      />
                    )}
                  </form.Field>
                </section>

                <section className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">Schedule</h3>
                    <p className="text-muted-foreground text-sm">
                      When should this run? Times use UTC.
                    </p>
                  </div>
                  <ScheduleFrequencyTabs
                    onChange={handleFrequencyChange}
                    value={frequency}
                  />
                  <ScheduleDayPicker
                    dayOfMonth={dayOfMonth}
                    dayOfWeek={dayOfWeek}
                    frequency={frequency}
                    onDayOfMonthChange={(day) =>
                      form.setFieldValue("schedule.dayOfMonth", day)
                    }
                    onDayOfWeekChange={(day) =>
                      form.setFieldValue("schedule.dayOfWeek", day)
                    }
                  />
                  <div className="space-y-2">
                    <Label
                      className="text-muted-foreground text-xs"
                      htmlFor="schedule-time"
                    >
                      Time
                    </Label>
                    <Input
                      className="w-full appearance-none bg-background sm:w-40 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      id="schedule-time"
                      onChange={(event) => {
                        const parsed = parseTimeValue(event.target.value);
                        if (parsed) {
                          form.setFieldValue("schedule.hour", parsed.hour);
                          form.setFieldValue("schedule.minute", parsed.minute);
                        }
                      }}
                      type="time"
                      value={formatTimeValue(hour, minute)}
                    />
                  </div>
                  <ScheduleSummaryCard schedule={schedule} />
                </section>

                <section className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-1 font-semibold text-base">
                      Sources
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Pick which integrations we should pull activity from.
                    </p>
                  </div>
                  {isLoadingRepos && <Skeleton className="h-10 w-full" />}
                  {!isLoadingRepos && integrationOptions.length === 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed p-3">
                      <span className="flex-1 text-muted-foreground text-xs">
                        No integrations connected yet.
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
                    <form.Field name="repositoryIds">
                      {(field) => (
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
                    </form.Field>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-base">
                      {FORMAT_CARD_META[outputType].label} rules
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      How far back we look and how the post should sound.
                    </p>
                  </div>
                  <form.Field name="lookbackWindow">
                    {(field) => (
                      <div className="space-y-2">
                        <Label
                          className="text-muted-foreground text-xs"
                          htmlFor="schedule-lookback"
                        >
                          Lookback window
                        </Label>
                        <Select
                          onValueChange={(value) => {
                            if (value) {
                              field.handleChange(value as LookbackWindow);
                            }
                          }}
                          value={field.state.value}
                        >
                          <SelectTrigger
                            className="w-full"
                            id="schedule-lookback"
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
                      </div>
                    )}
                  </form.Field>

                  {brandVoices.length > 1 && (
                    <form.Field name="brandVoiceId">
                      {(field) => (
                        <BrandIdentityRadioGroup
                          description="Choose which brand voice to use for generated content."
                          emptyOption={{
                            label: defaultBrandVoiceLabel,
                            description: "Use your default brand voice.",
                          }}
                          id={field.name}
                          label="Brand voice"
                          onChange={field.handleChange}
                          value={field.state.value}
                          voices={nonDefaultBrandVoices}
                        />
                      )}
                    </form.Field>
                  )}

                  {supportsAutoPublish(outputType) && (
                    <form.Field name="autoPublish">
                      {(field) => (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-1.5">
                            <Label
                              className="cursor-pointer font-medium text-sm"
                              htmlFor={field.name}
                            >
                              Auto-publish
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
                                  When on, posts are published immediately
                                  instead of saved as drafts.
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
                  )}
                </section>
              </div>
            </div>

            <div className="shrink-0 border-t bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <FooterStatus
                  errorMessage={formError}
                  repositoryCount={repositoryCount}
                />
                <div className="flex items-center gap-2">
                  <Button
                    disabled={mutation.isPending}
                    onClick={() => setOpen(false)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button disabled={mutation.isPending} type="submit">
                    {mutation.isPending ? (
                      <>
                        <HugeiconsIcon
                          className="size-4 animate-spin"
                          icon={Loading03Icon}
                        />
                        {isEditMode ? "Saving..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon className="size-4" icon={Add01Icon} />
                        {isEditMode ? "Save changes" : "Add schedule"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
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

interface FooterStatusProps {
  errorMessage: string | null;
  repositoryCount: number;
}

function FooterStatus({ errorMessage, repositoryCount }: FooterStatusProps) {
  if (errorMessage) {
    return (
      <span className="flex items-center gap-1.5 font-medium text-destructive text-xs">
        <HugeiconsIcon className="size-3.5" icon={AlertCircleIcon} />
        {errorMessage}
      </span>
    );
  }
  return (
    <span
      className={cn("flex items-center gap-1.5 text-muted-foreground text-xs")}
    >
      {repositoryCount === 0
        ? "No sources selected yet"
        : `${repositoryCount} source${repositoryCount === 1 ? "" : "s"} selected`}
    </span>
  );
}
