"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Github } from "@notra/ui/components/ui/svgs/github";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { BrandVoiceCell } from "@/components/automation/brand-voice-cell";
import { EventsPageSkeleton } from "@/components/automation/events-skeleton";
import { TriggerRowActions } from "@/components/automation/triggers/trigger-row-actions";
import { AddTriggerDialog } from "@/components/automation/triggers/trigger-sheet";
import { TriggerStatusBadge } from "@/components/automation/triggers/trigger-status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { BrandSettings } from "@/types/hooks/brand-analysis";
import type { Trigger, TriggerSourceType } from "@/types/triggers/triggers";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";

const EVENT_SOURCE_TYPES: TriggerSourceType[] = ["github_webhook"];

function formatEventList(events?: string[]) {
  if (!events || events.length === 0) {
    return "All events";
  }
  return events.map((event) => event.replace("_", " ")).join(", ");
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
  const [createdSortOrder, setCreatedSortOrder] = useState<
    false | "asc" | "desc"
  >(false);

  const { data, isPending } = useQuery(
    dashboardOrpc.automation.events.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const { data: brandResponse } = useQuery(
    dashboardOrpc.brand.voices.list.queryOptions({
      input: { organizationId: organizationId ?? "" },
      enabled: !!organizationId,
    })
  );

  const { brandVoiceMap, defaultBrandVoice } = useMemo(() => {
    const map: Record<string, BrandSettings> = {};
    let defaultVoice: BrandSettings | undefined;
    for (const voice of brandResponse?.voices ?? []) {
      map[voice.id] = voice;
      if (voice.isDefault) {
        defaultVoice = voice;
      }
    }
    return { brandVoiceMap: map, defaultBrandVoice: defaultVoice };
  }, [brandResponse]);

  const updateMutation = useMutation({
    mutationFn: async (trigger: Trigger) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return dashboardOrpc.automation.events.update.call({
        organizationId,
        triggerId: trigger.id,
        sourceType: trigger.sourceType,
        sourceConfig: trigger.sourceConfig,
        targets: trigger.targets,
        outputType: trigger.outputType,
        outputConfig: trigger.outputConfig ?? {},
        enabled: !trigger.enabled,
        autoPublish: trigger.autoPublish,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.automation.events.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
    },
    onError: () => {
      toast.error("Failed to update trigger");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (triggerId: string) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      return dashboardOrpc.automation.events.delete.call({
        organizationId,
        triggerId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.automation.events.list.queryKey({
          input: { organizationId: organizationId ?? "" },
        }),
      });
      toast.success("Event trigger removed");
    },
    onError: () => {
      toast.error("Failed to delete trigger");
    },
  });

  const triggers = data?.triggers ?? [];
  const eventTriggers = useMemo(
    () => triggers.filter((trigger) => trigger.sourceType === "github_webhook"),
    [triggers]
  );

  const filteredTriggers = useMemo(() => {
    return eventTriggers.filter((t) =>
      activeTab === "active" ? t.enabled : !t.enabled
    );
  }, [eventTriggers, activeTab]);

  const activeCounts = useMemo(() => {
    let active = 0;
    let paused = 0;
    for (const t of eventTriggers) {
      if (t.enabled) {
        active++;
      } else {
        paused++;
      }
    }
    return { active, paused };
  }, [eventTriggers]);

  const handleToggle = useCallback(
    (trigger: Trigger) => updateMutation.mutate(trigger),
    [updateMutation]
  );

  const handleDelete = useCallback(
    (id: string) => deleteMutation.mutate(id),
    [deleteMutation]
  );

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              React to GitHub activity and trigger content generation
              automatically
            </p>
          </div>
          <AddTriggerDialog
            allowedSourceTypes={EVENT_SOURCE_TYPES}
            initialSourceType="github_webhook"
            onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: dashboardOrpc.automation.events.list.queryKey({
                  input: { organizationId: organizationId ?? "" },
                }),
              })
            }
            organizationId={organizationId ?? ""}
            trigger={
              <Button size="sm" variant="default">
                <PlusIcon className="size-4" />
                <span className="ml-1">New Event Trigger</span>
              </Button>
            }
          />
        </div>

        {isPending && <EventsPageSkeleton />}

        {!isPending && eventTriggers.length === 0 && (
          <EmptyState
            action={
              <AddTriggerDialog
                allowedSourceTypes={EVENT_SOURCE_TYPES}
                initialSourceType="github_webhook"
                onSuccess={() =>
                  queryClient.invalidateQueries({
                    queryKey: dashboardOrpc.automation.events.list.queryKey({
                      input: { organizationId: organizationId ?? "" },
                    }),
                  })
                }
                organizationId={organizationId ?? ""}
                trigger={
                  <Button size="sm" variant="outline">
                    <PlusIcon className="size-4" />
                    <span className="ml-1">New Event Trigger</span>
                  </Button>
                }
              />
            }
            description="Create your first event trigger to react to GitHub activity."
            title="No event triggers yet"
          />
        )}

        {!isPending && eventTriggers.length > 0 && (
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
              <EventTable
                brandVoiceMap={brandVoiceMap}
                createdSortOrder={createdSortOrder}
                defaultBrandVoice={defaultBrandVoice}
                onDelete={handleDelete}
                onSortCreatedChange={setCreatedSortOrder}
                onToggle={handleToggle}
                triggers={filteredTriggers}
              />
            </TabsContent>

            <TabsContent className="mt-4" value="paused">
              <EventTable
                brandVoiceMap={brandVoiceMap}
                createdSortOrder={createdSortOrder}
                defaultBrandVoice={defaultBrandVoice}
                onDelete={handleDelete}
                onSortCreatedChange={setCreatedSortOrder}
                onToggle={handleToggle}
                triggers={filteredTriggers}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageContainer>
  );
}

function EventTable({
  triggers,
  brandVoiceMap,
  createdSortOrder,
  defaultBrandVoice,
  onSortCreatedChange,
  onToggle,
  onDelete,
}: {
  triggers: Trigger[];
  brandVoiceMap: Record<string, BrandSettings>;
  createdSortOrder: false | "asc" | "desc";
  defaultBrandVoice?: BrandSettings;
  onSortCreatedChange: (next: false | "asc" | "desc") => void;
  onToggle: (trigger: Trigger) => void;
  onDelete: (triggerId: string) => void;
}) {
  const sortedTriggers = useMemo(() => {
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
  }, [triggers, createdSortOrder]);

  function getSortIcon(isSorted: false | "asc" | "desc") {
    if (isSorted === "asc") {
      return ArrowUp01Icon;
    }
    if (isSorted === "desc") {
      return ArrowDown01Icon;
    }
    return ArrowUpDownIcon;
  }
  const sortIcon = getSortIcon(createdSortOrder);

  if (triggers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        No event triggers in this category.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Output</TableHead>
            <TableHead>Targets</TableHead>
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
            const explicitBrandVoiceId = trigger.outputConfig?.brandVoiceId;
            const hasExplicitVoice = !!explicitBrandVoiceId;
            const brandVoice = explicitBrandVoiceId
              ? brandVoiceMap[explicitBrandVoiceId]
              : defaultBrandVoice;

            return (
              <TableRow key={trigger.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50">
                      <Github className="size-4" />
                    </span>
                    <span className="text-sm">GitHub Webhook</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground capitalize">
                  {formatEventList(trigger.sourceConfig.eventTypes)}
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
                  {trigger.targets.repositoryIds.length} repositories
                </TableCell>
                <TableCell>
                  <TriggerStatusBadge enabled={trigger.enabled} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(trigger.createdAt)}
                </TableCell>
                <TableCell>
                  <TriggerRowActions
                    onDelete={onDelete}
                    onToggle={onToggle}
                    trigger={trigger}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
