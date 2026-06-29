"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
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
import { useHotkey } from "@tanstack/react-hotkeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BrandVoiceCell } from "@/components/automation/brand-voice-cell";
import { CreateEventTriggerDialog } from "@/components/automation/events/create-event-trigger-dialog";
import { EventsPageSkeleton } from "@/components/automation/events-skeleton";
import { SourcesCell } from "@/components/automation/sources-cell";
import { TriggerRowActions } from "@/components/automation/triggers/trigger-row-actions";
import { TriggerStatusBadge } from "@/components/automation/triggers/trigger-status-badge";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { BrandSettings } from "@/types/hooks/brand-analysis";
import type { Trigger } from "@/types/triggers/triggers";
import {
  getDefaultEventTriggerValues,
  isAutomationOutputType,
} from "@/utils/event-trigger-form";
import { getOutputTypeLabel, OutputTypeIcon } from "@/utils/output-types";

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatEventList(events?: string[]) {
  if (!events || events.length === 0) {
    return "All events";
  }
  return events.map((event) => event.replace("_", " ")).join(", ");
}

function formatDate(dateString: string) {
  return DATE_FORMATTER.format(new Date(dateString));
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
  const [createdSortOrder, setCreatedSortOrder] = useState<
    false | "asc" | "desc"
  >(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrigger, setEditTrigger] = useState<Trigger | null>(null);

  useHotkey("C", () => setCreateOpen(true), { enabled: !createOpen });

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

  const brandVoiceMap: Record<string, BrandSettings> = {};
  let defaultBrandVoice: BrandSettings | undefined;
  for (const voice of brandResponse?.voices ?? []) {
    brandVoiceMap[voice.id] = voice;
    if (voice.isDefault) {
      defaultBrandVoice = voice;
    }
  }

  const updateMutation = useMutation({
    mutationFn: async (trigger: Trigger) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const values = getDefaultEventTriggerValues(trigger);
      const outputType = isAutomationOutputType(trigger.outputType)
        ? trigger.outputType
        : values.outputType;

      return dashboardOrpc.automation.events.update.call({
        organizationId,
        triggerId: trigger.id,
        sourceType: "github_webhook",
        sourceConfig: {
          eventTypes: trigger.sourceConfig.eventTypes ?? [values.eventType],
        },
        targets: trigger.targets,
        outputType,
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

  const eventTriggers =
    data?.triggers.filter(
      (trigger) => trigger.sourceType === "github_webhook"
    ) ?? [];
  const filteredTriggers = eventTriggers.filter((trigger) =>
    activeTab === "active" ? trigger.enabled : !trigger.enabled
  );

  let active = 0;
  let paused = 0;
  for (const trigger of eventTriggers) {
    if (trigger.enabled) {
      active++;
    } else {
      paused++;
    }
  }

  const handleToggle = (trigger: Trigger) => {
    updateMutation.mutate(trigger);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (trigger: Trigger) => {
    setEditTrigger(trigger);
  };

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
          <CreateEventTriggerDialog
            onOpenChange={setCreateOpen}
            onSuccess={() =>
              queryClient.invalidateQueries({
                queryKey: dashboardOrpc.automation.events.list.queryKey({
                  input: { organizationId: organizationId ?? "" },
                }),
              })
            }
            open={createOpen}
            organizationId={organizationId ?? ""}
            trigger={
              <Button className="gap-1.5">
                <HugeiconsIcon className="size-4" icon={Add01Icon} />
                Create Trigger
                <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
              </Button>
            }
          />
        </div>

        {isPending && <EventsPageSkeleton />}

        {!isPending && eventTriggers.length === 0 && (
          <EmptyState
            action={
              <CreateEventTriggerDialog
                onSuccess={() =>
                  queryClient.invalidateQueries({
                    queryKey: dashboardOrpc.automation.events.list.queryKey({
                      input: { organizationId: organizationId ?? "" },
                    }),
                  })
                }
                organizationId={organizationId ?? ""}
                trigger={
                  <Button className="gap-1.5" variant="outline">
                    <HugeiconsIcon className="size-4" icon={Add01Icon} />
                    Create Trigger
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
              <TabsTrigger value="active">Active ({active})</TabsTrigger>
              <TabsTrigger value="paused">Paused ({paused})</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4" value="active">
              <EventTable
                brandVoiceMap={brandVoiceMap}
                createdSortOrder={createdSortOrder}
                defaultBrandVoice={defaultBrandVoice}
                onDelete={handleDelete}
                onEdit={handleEdit}
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
                onEdit={handleEdit}
                onSortCreatedChange={setCreatedSortOrder}
                onToggle={handleToggle}
                triggers={filteredTriggers}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
      {editTrigger && (
        <CreateEventTriggerDialog
          editTrigger={editTrigger}
          onOpenChange={(open) => !open && setEditTrigger(null)}
          onSuccess={() => {
            setEditTrigger(null);
            queryClient.invalidateQueries({
              queryKey: dashboardOrpc.automation.events.list.queryKey({
                input: { organizationId: organizationId ?? "" },
              }),
            });
          }}
          open={!!editTrigger}
          organizationId={organizationId ?? ""}
        />
      )}
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
  onEdit,
}: {
  triggers: Trigger[];
  brandVoiceMap: Record<string, BrandSettings>;
  createdSortOrder: false | "asc" | "desc";
  defaultBrandVoice?: BrandSettings;
  onSortCreatedChange: (next: false | "asc" | "desc") => void;
  onToggle: (trigger: Trigger) => void;
  onDelete: (triggerId: string) => void;
  onEdit: (trigger: Trigger) => void;
}) {
  const sortedTriggers =
    createdSortOrder === false
      ? triggers
      : Array.from(triggers).sort((a, b) => {
          const createdAtA = new Date(a.createdAt).getTime();
          const createdAtB = new Date(b.createdAt).getTime();
          return createdSortOrder === "desc"
            ? createdAtB - createdAtA
            : createdAtA - createdAtB;
        });

  const sortIcon = getSortIcon(createdSortOrder);

  if (triggers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        No event triggers in this category.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/80 border-b-border/40 bg-muted/80 shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Events</TableHead>
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
                  <SourcesCell repositoryIds={trigger.targets.repositoryIds} />
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
                    onEdit={onEdit}
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
