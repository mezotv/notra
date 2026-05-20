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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandVoiceCombobox } from "@/components/brand-voice-combobox";
import { FormatCard } from "@/components/content/create/format-card";
import { AddIntegrationDialog } from "@/components/integrations/add-integration-dialog";
import { AddRepositoryButton } from "@/components/integrations/add-repository-button";
import { AddRepositoryDialog } from "@/components/integrations/add-repository-dialog";
import { FORMAT_CARD_META, FORMAT_ORDER } from "@/constants/content-formats";
import { supportsAutoPublish } from "@/constants/schedule-output-types";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  LOOKBACK_WINDOWS,
  type LookbackWindow,
  MAX_SCHEDULE_NAME_LENGTH,
} from "@/schemas/integrations";
import type {
  CreateScheduleDialogProps,
  ScheduleCron,
  ScheduleFormValues,
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

  const [values, setValues] = useState<ScheduleFormValues>(() =>
    getDefaultScheduleValues(editTrigger)
  );
  const [nameTouched, setNameTouched] = useState(isEditMode);
  const [addRepoOpen, setAddRepoOpen] = useState(false);
  const comboboxAnchor = useComboboxAnchor();

  useEffect(() => {
    if (open) {
      setValues(getDefaultScheduleValues(editTrigger));
      setNameTouched(!!editTrigger);
    }
  }, [open, editTrigger]);

  const autoName = useMemo(
    () => buildAutoScheduleName(values.schedule.frequency, values.outputType),
    [values.schedule.frequency, values.outputType]
  );

  useEffect(() => {
    if (nameTouched) {
      return;
    }
    setValues((prev) =>
      prev.name === autoName ? prev : { ...prev, name: autoName }
    );
  }, [autoName, nameTouched]);

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

  const updateValues = useCallback((patch: Partial<ScheduleFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSchedule = useCallback((patch: Partial<ScheduleCron>) => {
    setValues((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, ...patch },
    }));
  }, []);

  const handleFrequencyChange = useCallback(
    (frequency: ScheduleCron["frequency"]) => {
      setValues((prev) => {
        const next: ScheduleCron = { ...prev.schedule, frequency };
        if (frequency === "weekly") {
          next.dayOfWeek = prev.schedule.dayOfWeek ?? 1;
          next.dayOfMonth = undefined;
        } else if (frequency === "monthly") {
          next.dayOfMonth = prev.schedule.dayOfMonth ?? 1;
          next.dayOfWeek = undefined;
        } else {
          next.dayOfWeek = undefined;
          next.dayOfMonth = undefined;
        }
        return { ...prev, schedule: next };
      });
    },
    []
  );

  const handleTimeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseTimeValue(event.target.value);
      if (parsed) {
        updateSchedule(parsed);
      }
    },
    [updateSchedule]
  );

  const timeValue = formatTimeValue(
    values.schedule.hour,
    values.schedule.minute
  );

  const meta = FORMAT_CARD_META[values.outputType];

  const githubRepoCount = useMemo(
    () => values.repositoryIds.filter((id) => !id.startsWith("linear:")).length,
    [values.repositoryIds]
  );

  const isValid = values.name.trim().length > 0 && githubRepoCount > 0;

  const footerStatus = useMemo<{
    text: string;
    tone: "warning" | "muted";
  }>(() => {
    if (values.repositoryIds.length === 0) {
      return {
        text: "Pick at least one source to continue",
        tone: "warning",
      };
    }
    if (githubRepoCount === 0) {
      return {
        text: "Schedules need at least one GitHub repository",
        tone: "warning",
      };
    }
    if (values.name.trim().length === 0) {
      return { text: "Give this schedule a name", tone: "warning" };
    }
    const count = values.repositoryIds.length;
    return {
      text: `${count} source${count === 1 ? "" : "s"} selected`,
      tone: "muted",
    };
  }, [values.name, values.repositoryIds.length, githubRepoCount]);

  const handleSubmit = useCallback(() => {
    if (!isValid || mutation.isPending) {
      return;
    }
    mutation.mutate(values);
  }, [isValid, mutation, values]);

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

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-8 p-6">
              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Content format</h3>
                  <p className="text-muted-foreground text-sm">
                    What should we generate?
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {FORMAT_ORDER.map((type) => (
                    <FormatCard
                      format={type}
                      key={type}
                      onToggle={() => updateValues({ outputType: type })}
                      selected={values.outputType === type}
                    />
                  ))}
                </div>
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
                <Input
                  id="schedule-name"
                  maxLength={MAX_SCHEDULE_NAME_LENGTH}
                  onChange={(event) => {
                    setNameTouched(true);
                    updateValues({ name: event.target.value });
                  }}
                  placeholder={autoName}
                  value={values.name}
                />
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
                  value={values.schedule.frequency}
                />
                <ScheduleDayPicker
                  dayOfMonth={values.schedule.dayOfMonth}
                  dayOfWeek={values.schedule.dayOfWeek}
                  frequency={values.schedule.frequency}
                  onDayOfMonthChange={(day) =>
                    updateSchedule({ dayOfMonth: day })
                  }
                  onDayOfWeekChange={(day) =>
                    updateSchedule({ dayOfWeek: day })
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
                    onChange={handleTimeChange}
                    type="time"
                    value={timeValue}
                  />
                </div>
                <ScheduleSummaryCard schedule={values.schedule} />
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
                  <div ref={comboboxAnchor}>
                    <Combobox
                      items={integrationOptions.map((o) => o.value)}
                      multiple
                      onValueChange={(value) =>
                        updateValues({
                          repositoryIds: Array.isArray(value) ? value : [],
                        })
                      }
                      value={values.repositoryIds}
                    >
                      <ComboboxChips>
                        {values.repositoryIds.map((id) => {
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
                        <ComboboxEmpty>No integrations found.</ComboboxEmpty>
                        <ComboboxList>
                          {integrationOptions.map((opt) => (
                            <ComboboxItem key={opt.value} value={opt.value}>
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
              </section>

              <section className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">
                    {meta.label} rules
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    How far back we look and how the post should sound.
                  </p>
                </div>
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
                        updateValues({
                          lookbackWindow: value as LookbackWindow,
                        });
                      }
                    }}
                    value={values.lookbackWindow}
                  >
                    <SelectTrigger className="w-full" id="schedule-lookback">
                      <SelectValue placeholder="Lookback window">
                        <span className="capitalize">
                          {formatSnakeCaseLabel(values.lookbackWindow)}
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

                {brandVoices.length > 1 && (
                  <BrandVoiceCombobox
                    id="schedule-brand-voice"
                    onChange={(value) => updateValues({ brandVoiceId: value })}
                    value={values.brandVoiceId}
                    voices={brandVoices}
                  />
                )}

                {supportsAutoPublish(values.outputType) && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-1.5">
                      <Label
                        className="cursor-pointer font-medium text-sm"
                        htmlFor="schedule-auto-publish"
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
                            When on, posts are published immediately instead of
                            saved as drafts.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch
                      checked={values.autoPublish}
                      id="schedule-auto-publish"
                      onCheckedChange={(value) =>
                        updateValues({ autoPublish: value })
                      }
                    />
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="shrink-0 border-t bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  footerStatus.tone === "warning"
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {footerStatus.tone === "warning" && (
                  <HugeiconsIcon className="size-3.5" icon={AlertCircleIcon} />
                )}
                {footerStatus.text}
              </span>
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
                <Button
                  disabled={!isValid || mutation.isPending}
                  onClick={handleSubmit}
                  type="button"
                >
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
