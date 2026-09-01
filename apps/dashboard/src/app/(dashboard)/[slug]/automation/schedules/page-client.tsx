"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Delete02Icon,
  Edit02Icon,
  MoreVerticalIcon,
  PauseIcon,
  PlayCircleIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@notra/ui/components/shared/responsive-alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Kbd } from "@notra/ui/components/ui/kbd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BrandVoiceCell } from "@/components/automation/brand-voice-cell";
import { OnboardingSuggestions } from "@/components/automation/onboarding-suggestions";
import { CreateScheduleDialog } from "@/components/automation/schedules/create-schedule-dialog";
import { SourcesCell } from "@/components/automation/sources-cell";
import { TriggerStatusBadge } from "@/components/automation/triggers/trigger-status-badge";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import { useCreateFromSuggestion } from "@/lib/hooks/use-onboarding";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { BrandSettings } from "@/types/hooks/brand-analysis";
import type { Trigger } from "@/types/triggers/triggers";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";

import { SchedulePageSkeleton } from "./skeleton";

function formatFrequency(cron?: Trigger["sourceConfig"]["cron"]) {
  if (!cron) {
    return "Not set";
  }
  const time = `${String(cron.hour).padStart(2, "0")}:${String(cron.minute).padStart(2, "0")} UTC`;
  if (cron.frequency === "weekly") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `Weekly - ${days[cron.dayOfWeek ?? 0]} @ ${time}`;
  }
  if (cron.frequency === "monthly") {
    return `Monthly - Day ${cron.dayOfMonth ?? 1} @ ${time}`;
  }
  return `Daily @ ${time}`;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function normalizeIntegrationError(error: unknown): Error {
  const errorWithCode = error as Error & { code?: string };
  if (
    errorWithCode?.code === "INTEGRATION_NOT_FOUND" ||
    (error instanceof Error &&
      error.message.includes("integrations have been deleted"))
  ) {
    const integrationError = new Error(
      error instanceof Error ? error.message : "Integration not found"
    ) as Error & { code?: string };
    integrationError.code = "INTEGRATION_NOT_FOUND";
    return integrationError;
  }
  return error instanceof Error ? error : new Error(String(error));
}

function getSortIcon(isSorted: false | "asc" | "desc") {
  if (isSorted === "asc") {
    return ArrowUp01Icon;
  }
  if (isSorted === "desc") {
    return ArrowDown01Icon;
  }
  return ArrowUpDownIcon;
}

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization } = useOrganizationsContext();
  const organization = getOrganization(organizationSlug);
  const organizationId = organization?.id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"active" | "paused">("active");
  const [deleteTriggerId, setDeleteTriggerId] = useState<string | null>(null);
  const [editTrigger, setEditTrigger] = useState<Trigger | null>(null);
  const [createdSortOrder, setCreatedSortOrder] = useState<
    false | "asc" | "desc"
  >(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { beginCreate, cancelCreate, handleCreateSuccess, pendingSuggestion } =
    useCreateFromSuggestion(organizationId);

  useHotkey("C", () => setCreateOpen(true), { enabled: !createOpen });

  const { data, isPending } = useQuery(
    dashboardOrpc.automation.schedules.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const repositoryMap = data?.repositoryMap ?? {};

  const { data: brandResponse } = useQuery(
    dashboardOrpc.brand.voices.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const { brandVoiceMap, defaultBrandVoice } = (() => {
    const map: Record<string, BrandSettings> = {};
    let defaultVoice: BrandSettings | undefined;
    for (const voice of brandResponse?.voices ?? []) {
      map[voice.id] = voice;
      if (voice.isDefault) {
        defaultVoice = voice;
      }
    }
    return { brandVoiceMap: map, defaultBrandVoice: defaultVoice };
  })();

  const updateMutation = useMutation({
    mutationFn: async (trigger: Trigger) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      const cronConfig = trigger.sourceConfig.cron;
      if (!cronConfig) {
        throw new Error("Invalid schedule configuration");
      }

      if (trigger.outputType === "investor_update") {
        throw new Error("Unsupported schedule output");
      }

      const lookbackWindow = trigger.lookbackWindow ?? "last_7_days";
      const outputConfig = trigger.outputConfig ?? {};

      try {
        return await dashboardOrpc.automation.schedules.update.call({
          organizationId,
          triggerId: trigger.id,
          name: trigger.name,
          sourceType: "cron",
          sourceConfig: { cron: cronConfig },
          targets: trigger.targets,
          outputType: trigger.outputType,
          lookbackWindow,
          outputConfig,
          enabled: !trigger.enabled,
          autoPublish: trigger.autoPublish,
        });
      } catch (error) {
        throw normalizeIntegrationError(error);
      }
    },
    onError: (error) => {
      const errorWithCode = error as Error & { code?: string };
      if (errorWithCode.code === "INTEGRATION_NOT_FOUND") {
        toast.error(
          "Cannot enable schedule: The integration has been deleted. Please edit the schedule and select a different integration."
        );
      } else {
        toast.error("Failed to update schedule");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.automation.schedules.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.onboarding.get.queryKey({
            input: { organizationId },
          }),
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return dashboardOrpc.automation.schedules.delete.call({
        organizationId,
        triggerId,
      });
    },
    onMutate: async (triggerId) => {
      await queryClient.cancelQueries({
        queryKey: dashboardOrpc.automation.schedules.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });

      const previousData = queryClient.getQueryData<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>(
        dashboardOrpc.automation.schedules.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        })
      );

      queryClient.setQueryData<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>(
        dashboardOrpc.automation.schedules.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
        (old) => {
          if (!old) {
            return old;
          }
          return {
            triggers: old.triggers.filter((t) => t.id !== triggerId),
            repositoryMap: old.repositoryMap,
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _triggerId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          dashboardOrpc.automation.schedules.list.queryKey({
            input: { organizationId: organizationId ?? "" },
          }),
          context.previousData
        );
      }
      toast.error("Failed to delete schedule");
    },
    onSuccess: () => {
      toast.success("Schedule removed");
      setDeleteTriggerId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.automation.schedules.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: dashboardOrpc.onboarding.get.queryKey({
            input: { organizationId },
          }),
        });
      }
    },
  });

  const runNowMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return dashboardOrpc.automation.schedules.runNow.call({
        organizationId,
        triggerId,
      });
    },
    onSuccess: () => {
      toast.success("Schedule triggered! Content will be generated shortly.");
      if (organizationId) {
        const key = dashboardOrpc.content.activeGenerations.list.queryKey({
          input: { organizationId },
        });
        queryClient.invalidateQueries({ queryKey: key });
        setTimeout(
          () => queryClient.invalidateQueries({ queryKey: key }),
          5000
        );
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to run schedule"
      );
    },
  });

  const triggers = data?.triggers ?? [];
  const scheduleTriggers = triggers.filter(
    (trigger) => trigger.sourceType === "cron"
  );

  const filteredTriggers = scheduleTriggers.filter((trigger) =>
    activeTab === "active" ? trigger.enabled : !trigger.enabled
  );

  const activeCounts = (() => {
    let active = 0;
    let paused = 0;
    for (const t of scheduleTriggers) {
      if (t.enabled) {
        active++;
      } else {
        paused++;
      }
    }
    return { active, paused };
  })();

  const handleToggle = (trigger: Trigger) => updateMutation.mutate(trigger);

  const handleDelete = (id: string) => {
    setDeleteTriggerId(id);
  };

  const handleEdit = (trigger: Trigger) => {
    setEditTrigger(trigger);
  };

  const confirmDelete = () => {
    if (deleteTriggerId) {
      deleteMutation.mutate(deleteTriggerId);
    }
  };

  const handleRunNow = (triggerId: string) => runNowMutation.mutate(triggerId);

  const triggerToDelete = deleteTriggerId
    ? triggers.find((t) => t.id === deleteTriggerId)
    : null;
  const deleteTriggerRepositoryNames = triggerToDelete
    ? triggerToDelete.targets.repositoryIds.map((id) => repositoryMap[id] ?? id)
    : [];

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
            <p className="text-muted-foreground">
              Configure cron schedules that run daily, weekly, or monthly
            </p>
          </div>
          <CreateScheduleDialog
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) {
                cancelCreate(pendingSuggestion);
              }
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: dashboardOrpc.automation.schedules.list.queryKey({
                  input: { organizationId: organizationId ?? "" },
                }),
              });
              if (organizationId) {
                queryClient.invalidateQueries({
                  queryKey: dashboardOrpc.onboarding.get.queryKey({
                    input: { organizationId },
                  }),
                });
              }
              handleCreateSuccess(pendingSuggestion);
            }}
            open={createOpen}
            organizationId={organizationId ?? ""}
            trigger={
              <Button className="w-fit gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon className="size-4" icon={Add01Icon} />
                  Create Schedule
                </span>
                <Kbd className="hidden sm:inline-flex">C</Kbd>
              </Button>
            }
          />
        </div>

        {organizationId && (
          <OnboardingSuggestions
            onCreate={(suggestionId) => {
              beginCreate(suggestionId);
              setCreateOpen(true);
            }}
            organizationId={organizationId}
            type="schedule_automation"
          />
        )}

        {isPending && <SchedulePageSkeleton />}

        {!isPending && scheduleTriggers.length === 0 && (
          <EmptyState
            action={
              <CreateScheduleDialog
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: dashboardOrpc.automation.schedules.list.queryKey({
                      input: { organizationId: organizationId ?? "" },
                    }),
                  });
                  if (organizationId) {
                    queryClient.invalidateQueries({
                      queryKey: dashboardOrpc.onboarding.get.queryKey({
                        input: { organizationId },
                      }),
                    });
                  }
                }}
                organizationId={organizationId ?? ""}
                trigger={
                  <Button className="gap-1.5" variant="outline">
                    <HugeiconsIcon className="size-4" icon={Add01Icon} />
                    Create Schedule
                  </Button>
                }
              />
            }
            description="Create your first schedule to automate recurring content."
            preview={
              <EmptyStateTablePreview
                columns={EMPTY_STATE_TABLE_COLUMNS.schedule}
                rows={EMPTY_STATE_TABLE_ROWS}
              />
            }
            title="No schedules yet"
          />
        )}

        {!isPending && scheduleTriggers.length > 0 && (
          <Tabs
            defaultValue="active"
            onValueChange={(value) =>
              setActiveTab(value as "active" | "paused")
            }
          >
            <TabsList variant="line">
              <TabsTrigger value="active">
                Active ({activeCounts.active})
              </TabsTrigger>
              <TabsTrigger value="paused">
                Paused ({activeCounts.paused})
              </TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4" value="active">
              <ScheduleTable
                brandVoiceMap={brandVoiceMap}
                createdSortOrder={createdSortOrder}
                defaultBrandVoice={defaultBrandVoice}
                isDeleting={deleteMutation.isPending}
                isRunning={runNowMutation.isPending}
                isUpdating={updateMutation.isPending}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onRunNow={handleRunNow}
                onSortCreatedChange={setCreatedSortOrder}
                onToggle={handleToggle}
                repositoryMap={repositoryMap}
                runningTriggerId={
                  runNowMutation.isPending
                    ? runNowMutation.variables
                    : undefined
                }
                triggers={filteredTriggers}
                updatingTriggerId={
                  updateMutation.isPending
                    ? updateMutation.variables?.id
                    : undefined
                }
              />
            </TabsContent>

            <TabsContent className="mt-4" value="paused">
              <ScheduleTable
                brandVoiceMap={brandVoiceMap}
                createdSortOrder={createdSortOrder}
                defaultBrandVoice={defaultBrandVoice}
                isDeleting={deleteMutation.isPending}
                isRunning={runNowMutation.isPending}
                isUpdating={updateMutation.isPending}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onRunNow={handleRunNow}
                onSortCreatedChange={setCreatedSortOrder}
                onToggle={handleToggle}
                repositoryMap={repositoryMap}
                runningTriggerId={
                  runNowMutation.isPending
                    ? runNowMutation.variables
                    : undefined
                }
                triggers={filteredTriggers}
                updatingTriggerId={
                  updateMutation.isPending
                    ? updateMutation.variables?.id
                    : undefined
                }
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ResponsiveAlertDialog
        onOpenChange={(open) => !open && setDeleteTriggerId(null)}
        open={!!deleteTriggerId}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Delete schedule?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              This will permanently delete{" "}
              {triggerToDelete ? (
                <Tooltip>
                  <TooltipTrigger className="text-foreground cursor-help font-medium underline decoration-dotted underline-offset-2">
                    {triggerToDelete.name}
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="top">
                    <div className="space-y-1 text-xs">
                      <p>
                        Runs:{" "}
                        {formatFrequency(triggerToDelete.sourceConfig.cron)}
                      </p>
                      <p>
                        Repositories: {deleteTriggerRepositoryNames.join(", ")}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ) : (
                "this schedule"
              )}
              . This action cannot be undone.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
              variant="destructive"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      {editTrigger && (
        <CreateScheduleDialog
          editTrigger={editTrigger}
          onOpenChange={(open) => !open && setEditTrigger(null)}
          onSuccess={() => {
            setEditTrigger(null);
            queryClient.invalidateQueries({
              queryKey: dashboardOrpc.automation.schedules.list.queryKey({
                input: { organizationId: organizationId ?? "" },
              }),
            });
            if (organizationId) {
              queryClient.invalidateQueries({
                queryKey: dashboardOrpc.onboarding.get.queryKey({
                  input: { organizationId },
                }),
              });
            }
          }}
          open={!!editTrigger}
          organizationId={organizationId ?? ""}
        />
      )}
    </PageContainer>
  );
}

function ScheduleTable({
  triggers,
  repositoryMap,
  brandVoiceMap,
  createdSortOrder,
  defaultBrandVoice,
  onSortCreatedChange,
  onToggle,
  onDelete,
  onEdit,
  onRunNow,
  isUpdating,
  isDeleting,
  isRunning,
  updatingTriggerId,
  runningTriggerId,
}: {
  triggers: Trigger[];
  repositoryMap: Record<string, string>;
  brandVoiceMap: Record<string, BrandSettings>;
  createdSortOrder: false | "asc" | "desc";
  defaultBrandVoice?: BrandSettings;
  onSortCreatedChange: (next: false | "asc" | "desc") => void;
  onToggle: (trigger: Trigger) => void;
  onDelete: (triggerId: string) => void;
  onEdit: (trigger: Trigger) => void;
  onRunNow: (triggerId: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isRunning: boolean;
  updatingTriggerId?: string;
  runningTriggerId?: string;
}) {
  const sortedTriggers = (() => {
    if (createdSortOrder === false) {
      return triggers;
    }
    return [...triggers].sort((a, b) => {
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();

      return createdSortOrder === "desc"
        ? createdAtB - createdAtA
        : createdAtA - createdAtB;
    });
  })();

  const sortIcon = getSortIcon(createdSortOrder);

  if (triggers.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        No schedules in this category.
      </div>
    );
  }

  return (
    <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Identity</TableHead>
            <TableHead>Output</TableHead>
            <TableHead>Sources</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button
                className="-ml-4"
                onClick={() =>
                  onSortCreatedChange(
                    createdSortOrder === "asc" ? "desc" : "asc"
                  )
                }
                variant="ghost"
              >
                Created At
                <HugeiconsIcon className="ml-2 size-4" icon={sortIcon} />
              </Button>
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTriggers.map((trigger) => {
            const isThisUpdating =
              isUpdating && updatingTriggerId === trigger.id;
            const isThisRunning = isRunning && runningTriggerId === trigger.id;

            const explicitBrandVoiceId = trigger.outputConfig?.brandVoiceId;
            const hasExplicitVoice = !!explicitBrandVoiceId;
            const brandVoice = explicitBrandVoiceId
              ? brandVoiceMap[explicitBrandVoiceId]
              : defaultBrandVoice;

            return (
              <TableRow key={trigger.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {trigger.name ?? "Untitled Schedule"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFrequency(trigger.sourceConfig.cron)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <BrandVoiceCell
                    isDefault={!hasExplicitVoice}
                    voice={brandVoice}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  <span className="flex items-center gap-1.5">
                    <OutputTypeIcon
                      className="size-3.5"
                      outputType={trigger.outputType}
                    />
                    {getOutputTypeLabel(trigger.outputType)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <SourcesCell
                    repositoryIds={trigger.targets.repositoryIds}
                    repositoryMap={repositoryMap}
                  />
                </TableCell>
                <TableCell>
                  <TriggerStatusBadge enabled={trigger.enabled} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(trigger.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isThisUpdating || isThisRunning}
                    >
                      {isThisUpdating || isThisRunning ? (
                        <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
                      ) : (
                        <HugeiconsIcon
                          className="text-muted-foreground size-4"
                          icon={MoreVerticalIcon}
                        />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(trigger)}>
                        <HugeiconsIcon className="size-4" icon={Edit02Icon} />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isRunning || !trigger.enabled}
                        onClick={() => onRunNow(trigger.id)}
                      >
                        <HugeiconsIcon
                          className="size-4"
                          icon={PlayCircleIcon}
                        />
                        Run now
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isUpdating}
                        onClick={() => onToggle(trigger)}
                      >
                        <HugeiconsIcon
                          className="size-4"
                          icon={trigger.enabled ? PauseIcon : PlayIcon}
                        />
                        {trigger.enabled ? "Pause" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={isDeleting}
                        onClick={() => onDelete(trigger.id)}
                        variant="destructive"
                      >
                        <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
