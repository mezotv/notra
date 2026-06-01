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
import { Label } from "@notra/ui/components/ui/label";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandIdentityRadioGroup } from "@/components/brand-identity-radio-group";
import { Button } from "@/components/button";
import { FormatCard } from "@/components/content/create/format-card";
import { AddIntegrationDialog } from "@/components/integrations/add-integration-dialog";
import { AddRepositoryButton } from "@/components/integrations/add-repository-button";
import { AddRepositoryDialog } from "@/components/integrations/add-repository-dialog";
import { FORMAT_CARD_META, FORMAT_ORDER } from "@/constants/content-formats";
import { EVENT_TYPE_ORDER } from "@/constants/event-triggers";
import { supportsAutoPublish } from "@/constants/schedule-output-types";
import { dashboardOrpc } from "@/lib/orpc/query";
import {
  type EventTriggerFormValues,
  eventTriggerFormSchema,
} from "@/schemas/automation/event-trigger-form";
import type { CreateEventTriggerDialogProps } from "@/types/automation/event-trigger";
import type { Trigger } from "@/types/triggers/triggers";
import { EventTypeCard } from "./event-type-card";

const DEFAULT_VALUES: EventTriggerFormValues = {
  eventType: "release",
  outputType: "changelog",
  repositoryIds: [],
  brandVoiceId: "",
  autoPublish: false,
};

export function CreateEventTriggerDialog({
  organizationId,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateEventTriggerDialogProps) {
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

  const mutation = useMutation<
    { trigger: Trigger },
    Error,
    EventTriggerFormValues
  >({
    mutationFn: async (value) => {
      const payload = {
        organizationId,
        sourceType: "github_webhook" as const,
        sourceConfig: { eventTypes: [value.eventType] },
        targets: { repositoryIds: value.repositoryIds },
        outputType: value.outputType,
        outputConfig: {
          ...(value.brandVoiceId ? { brandVoiceId: value.brandVoiceId } : {}),
        },
        enabled: true,
        autoPublish: supportsAutoPublish(value.outputType)
          ? value.autoPublish
          : false,
      };

      try {
        return await dashboardOrpc.automation.events.create.call(payload);
      } catch (error) {
        if (error instanceof Error && error.message === "Duplicate trigger") {
          throw new Error("Trigger already exists");
        }
        if (error instanceof Error && error.message) {
          throw error;
        }
        throw new Error("Failed to create trigger");
      }
    },
    onSuccess: (data) => {
      toast.success("Trigger added");
      onSuccess?.(data.trigger);
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    validators: {
      onSubmit: eventTriggerFormSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const outputType = useStore(form.store, (s) => s.values.outputType);
  const repositoryCount = useStore(
    form.store,
    (s) => s.values.repositoryIds.length
  );

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
    const repos = githubIntegrations.flatMap((i) =>
      i.repositories.filter((r) => r.enabled)
    );

    const options = repos.map((r) => ({
      value: r.id,
      label: r.defaultBranch
        ? `${r.owner}/${r.repo} · ${r.defaultBranch}`
        : `${r.owner}/${r.repo}`,
    }));

    return {
      integrationOptions: options,
      githubIntegrationId: githubIntegrations[0]?.id,
    };
  }, [integrationsResponse]);

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

  const handleOpenAddRepoFlow = useCallback(() => {
    setOpen(false);
    setAddRepoOpen(true);
  }, [setOpen]);

  return (
    <>
      <ResponsiveDialog onOpenChange={setOpen} open={open}>
        {trigger && <ResponsiveDialogTrigger render={trigger} />}
        <ResponsiveDialogContent className="flex h-[85vh] max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <ResponsiveDialogHeader className="shrink-0 border-b p-4 pr-14">
            <ResponsiveDialogTitle className="text-base">
              New event trigger
            </ResponsiveDialogTitle>
            <p className="text-muted-foreground text-sm">
              React to GitHub activity and generate content automatically.
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
                    <h3 className="font-semibold text-base">Trigger event</h3>
                    <p className="text-muted-foreground text-sm">
                      When should this fire?
                    </p>
                  </div>
                  <form.Field name="eventType">
                    {(field) => (
                      <div className="grid gap-3 md:grid-cols-2">
                        {EVENT_TYPE_ORDER.map((type) => (
                          <EventTypeCard
                            eventType={type}
                            key={type}
                            onSelect={() => field.handleChange(type)}
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
                      Repositories
                      <span aria-hidden="true" className="text-destructive">
                        *
                      </span>
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Pick which repositories should fire this trigger.
                    </p>
                  </div>
                  {isLoadingRepos && <Skeleton className="h-10 w-full" />}
                  {!isLoadingRepos && integrationOptions.length === 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed p-3">
                      <span className="flex-1 text-muted-foreground text-xs">
                        No GitHub repositories connected yet.
                      </span>
                      <AddRepositoryButton onAdd={handleOpenAddRepoFlow} />
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
                                      <Github className="size-3 shrink-0" />
                                      {opt.label}
                                    </span>
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
                                {integrationOptions.map((opt) => (
                                  <ComboboxItem
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    <span className="flex items-center gap-2">
                                      <Github className="size-3.5 shrink-0" />
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

                {(brandVoices.length > 1 ||
                  supportsAutoPublish(outputType)) && (
                  <section className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base">
                        {FORMAT_CARD_META[outputType].label} rules
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Voice and publishing behaviour for this trigger.
                      </p>
                    </div>

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
                )}
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
                        Adding...
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon className="size-4" icon={Add01Icon} />
                        Add trigger
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
    <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
      {repositoryCount === 0
        ? "No repositories selected yet"
        : `${repositoryCount} ${repositoryCount === 1 ? "repository" : "repositories"} selected`}
    </span>
  );
}
