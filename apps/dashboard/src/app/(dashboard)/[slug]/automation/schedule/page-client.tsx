"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
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
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { AddTriggerDialog } from "@/components/automation/triggers/trigger-sheet";
import { TriggerStatusBadge } from "@/components/automation/triggers/trigger-status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import type { Trigger, TriggerSourceType } from "@/types/lib/triggers/triggers";
import { getOutputTypeLabel } from "@/utils/output-types";
import { QUERY_KEYS } from "@/utils/query-keys";
import { SchedulePageSkeleton } from "./skeleton";

const CRON_SOURCE_TYPES: TriggerSourceType[] = ["cron"];

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
    return `Monthly - Day ${cron.dayOfMonth} @ ${time}`;
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
  const [createdSortOrder, setCreatedSortOrder] = useState<"asc" | "desc">(
    "desc"
  );

  const { data, isPending } = useQuery({
    queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const response = await fetch(
        `/api/organizations/${organizationId}/automation/schedules`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch triggers");
      }

      return response.json() as Promise<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>;
    },
    enabled: !!organizationId,
  });

  const repositoryMap = data?.repositoryMap ?? {};

  const updateMutation = useMutation({
    mutationFn: async (trigger: Trigger) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const response = await fetch(
        `/api/organizations/${organizationId}/automation/schedules?triggerId=${trigger.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trigger.name,
            sourceType: trigger.sourceType,
            sourceConfig: trigger.sourceConfig,
            targets: trigger.targets,
            outputType: trigger.outputType,
            lookbackWindow: trigger.lookbackWindow,
            outputConfig: trigger.outputConfig,
            enabled: !trigger.enabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      return response.json();
    },
    onMutate: async (trigger) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
      });

      const previousData = queryClient.getQueryData<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>(QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""));

      queryClient.setQueryData<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>(QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""), (old) => {
        if (!old) {
          return old;
        }
        return {
          triggers: old.triggers.map((t) =>
            t.id === trigger.id ? { ...t, enabled: !t.enabled } : t
          ),
          repositoryMap: old.repositoryMap,
        };
      });

      return { previousData };
    },
    onError: (_error, _trigger, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
          context.previousData
        );
      }
      toast.error("Failed to update schedule");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
      });
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const response = await fetch(
        `/api/organizations/${organizationId}/automation/schedules?triggerId=${triggerId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      return response.json();
    },
    onMutate: async (triggerId) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
      });

      const previousData = queryClient.getQueryData<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>(QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""));

      queryClient.setQueryData<{
        triggers: Trigger[];
        repositoryMap: Record<string, string>;
      }>(QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""), (old) => {
        if (!old) {
          return old;
        }
        return {
          triggers: old.triggers.filter((t) => t.id !== triggerId),
          repositoryMap: old.repositoryMap,
        };
      });

      return { previousData };
    },
    onError: (_error, _triggerId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
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
        queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
      });
      if (organizationId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
        });
      }
    },
  });

  const runNowMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const response = await fetch(
        `/api/organizations/${organizationId}/automation/schedules/run?triggerId=${triggerId}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to run schedule");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Schedule triggered! Content will be generated shortly.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to run schedule"
      );
    },
  });

  const triggers = data?.triggers ?? [];
  const scheduleTriggers = useMemo(
    () => triggers.filter((trigger) => trigger.sourceType === "cron"),
    [triggers]
  );

  const filteredTriggers = useMemo(() => {
    return scheduleTriggers.filter((t) =>
      activeTab === "active" ? t.enabled : !t.enabled
    );
  }, [scheduleTriggers, activeTab]);

  const activeCounts = useMemo(() => {
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
  }, [scheduleTriggers]);

  const handleToggle = useCallback(
    (trigger: Trigger) => updateMutation.mutate(trigger),
    [updateMutation]
  );

  const handleDelete = useCallback((id: string) => {
    setDeleteTriggerId(id);
  }, []);

  const handleEdit = useCallback((trigger: Trigger) => {
    setEditTrigger(trigger);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTriggerId) {
      deleteMutation.mutate(deleteTriggerId);
    }
  }, [deleteTriggerId, deleteMutation]);

  const handleRunNow = useCallback(
    (triggerId: string) => runNowMutation.mutate(triggerId),
    [runNowMutation]
  );

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
            <h1 className="font-bold text-3xl tracking-tight">
              Automation Schedules
            </h1>
            <p className="text-muted-foreground">
              Configure cron schedules that run daily, weekly, or monthly.
            </p>
          </div>
          <AddTriggerDialog
            allowedSourceTypes={CRON_SOURCE_TYPES}
            apiPath={
              organizationId
                ? `/api/organizations/${organizationId}/automation/schedules`
                : undefined
            }
            initialSourceType="cron"
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
              });
              if (organizationId) {
                queryClient.invalidateQueries({
                  queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
                });
              }
            }}
            organizationId={organizationId ?? ""}
            trigger={
              <Button size="sm" variant="default">
                <PlusIcon className="size-4" />
                <span className="ml-1">New Schedule</span>
              </Button>
            }
          />
        </div>

        {isPending && <SchedulePageSkeleton />}

        {!isPending && scheduleTriggers.length === 0 && (
          <EmptyState
            action={
              <AddTriggerDialog
                allowedSourceTypes={CRON_SOURCE_TYPES}
                apiPath={
                  organizationId
                    ? `/api/organizations/${organizationId}/automation/schedules`
                    : undefined
                }
                initialSourceType="cron"
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.AUTOMATION.schedules(
                      organizationId ?? ""
                    ),
                  });
                  if (organizationId) {
                    queryClient.invalidateQueries({
                      queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
                    });
                  }
                }}
                organizationId={organizationId ?? ""}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="size-4" />
                    <span className="ml-1">New Schedule</span>
                  </Button>
                }
              />
            }
            description="Create your first schedule to automate recurring content."
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
                createdSortOrder={createdSortOrder}
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
                createdSortOrder={createdSortOrder}
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
                  <TooltipTrigger className="cursor-help font-medium text-foreground underline decoration-dotted underline-offset-2">
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
        <AddTriggerDialog
          allowedSourceTypes={CRON_SOURCE_TYPES}
          apiPath={
            organizationId
              ? `/api/organizations/${organizationId}/automation/schedules`
              : undefined
          }
          editTrigger={editTrigger}
          initialSourceType="cron"
          onOpenChange={(open) => !open && setEditTrigger(null)}
          onSuccess={() => {
            setEditTrigger(null);
            queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.AUTOMATION.schedules(organizationId ?? ""),
            });
            if (organizationId) {
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.ONBOARDING.status(organizationId),
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
  createdSortOrder,
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
  createdSortOrder: "asc" | "desc";
  onSortCreatedChange: (next: "asc" | "desc") => void;
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
  const sortedTriggers = useMemo(() => {
    return [...triggers].sort((a, b) => {
      const createdAtA = new Date(a.createdAt).getTime();
      const createdAtB = new Date(b.createdAt).getTime();

      return createdSortOrder === "desc"
        ? createdAtB - createdAtA
        : createdAtA - createdAtB;
    });
  }, [triggers, createdSortOrder]);

  if (triggers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
        No schedules in this category.
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Output</TableHead>
            <TableHead>Targets</TableHead>
            <TableHead>Status</TableHead>
            <TableHead
              className="cursor-pointer select-none transition-colors hover:text-foreground"
              onClick={() =>
                onSortCreatedChange(
                  createdSortOrder === "desc" ? "asc" : "desc"
                )
              }
            >
              <span className="inline-flex items-center gap-1">
                Created
                <HugeiconsIcon
                  className="size-3.5"
                  icon={
                    createdSortOrder === "desc"
                      ? ArrowDown01Icon
                      : ArrowUp01Icon
                  }
                />
              </span>
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTriggers.map((trigger) => {
            const isThisUpdating =
              isUpdating && updatingTriggerId === trigger.id;
            const isThisRunning = isRunning && runningTriggerId === trigger.id;

            return (
              <TableRow key={trigger.id}>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">
                      {trigger.name ?? "Untitled Schedule"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatFrequency(trigger.sourceConfig.cron)}
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {getOutputTypeLabel(trigger.outputType)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger className="cursor-help">
                      {trigger.targets.repositoryIds.length} repositories
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="top">
                      <ul className="space-y-0.5">
                        {trigger.targets.repositoryIds.map((id) => (
                          <li key={id}>{repositoryMap[id] ?? id}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
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
                      className="flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isThisUpdating || isThisRunning}
                    >
                      {isThisUpdating || isThisRunning ? (
                        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                      ) : (
                        <HugeiconsIcon
                          className="size-4 text-muted-foreground"
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
