"use client";

import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";
import { cn } from "@notra/ui/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { AgentFeedbackDetailDialog } from "@/components/agent-feedback/feedback-detail-dialog";
import { AgentFeedbackEmpty } from "@/components/agent-feedback/feedback-empty";
import { AgentFeedbackSetupDialog } from "@/components/agent-feedback/feedback-setup-dialog";
import { AgentFeedbackTable } from "@/components/agent-feedback/feedback-table";
import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { AGENT_FEEDBACK_STATUS_FILTERS } from "@/constants/agent-feedback";
import {
  useAgentFeedbackList,
  useAgentFeedbackUpdateStatus,
} from "@/lib/hooks/use-agent-feedback";
import type {
  AgentFeedbackPageClientProps,
  AgentFeedbackStatusFilter,
} from "@/types/agent-feedback";
import { isAgentFeedbackStatusFilter } from "@/utils/agent-feedback";

function isStatusFilter(value: string): value is AgentFeedbackStatusFilter {
  return AGENT_FEEDBACK_STATUS_FILTERS.some((filter) => filter.value === value);
}

export default function PageClient(_props: AgentFeedbackPageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const [statusFilter, setStatusFilter] =
    useState<AgentFeedbackStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useAgentFeedbackList(organizationId, statusFilter);
  const updateStatus = useAgentFeedbackUpdateStatus(organizationId);

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const counts = list.data?.pages[0]?.counts;
  const totalCount = counts
    ? Object.values(counts).reduce((sum, value) => sum + value, 0)
    : 0;
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const isLoading = !!organizationId && list.isPending;
  const showEmptyState = !isLoading && totalCount === 0;

  const countFor = (filter: AgentFeedbackStatusFilter) => {
    if (!counts) {
      return null;
    }
    return filter === "all" ? totalCount : counts[filter];
  };

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            <p className="text-muted-foreground">
              What AI agents are saying about your product.
            </p>
          </div>
          {organizationId && !showEmptyState ? (
            <AgentFeedbackSetupDialog organizationId={organizationId} />
          ) : null}
        </div>

        {showEmptyState ? (
          <AgentFeedbackEmpty organizationId={organizationId} />
        ) : (
          <>
            <Tabs
              onValueChange={(value) => {
                if (isAgentFeedbackStatusFilter(value)) {
                  setStatusFilter(value);
                }
              }}
              value={statusFilter}
            >
              <TabsList variant="line">
                {AGENT_FEEDBACK_STATUS_FILTERS.map((filter) => {
                  const count = countFor(filter.value);
                  return (
                    <TabsTrigger key={filter.value} value={filter.value}>
                      {filter.label}
                      {count !== null ? (
                        <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
                          {count}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <div
              className={cn(
                "transition-opacity duration-200",
                list.isPlaceholderData && "opacity-60"
              )}
            >
              <AgentFeedbackTable
                isPending={isLoading}
                items={items}
                onSelect={(item) => setSelectedId(item.id)}
                selectedId={selectedId}
              />
            </div>

            {list.hasNextPage ? (
              <div className="flex justify-center">
                <Button
                  disabled={list.isFetchingNextPage}
                  onClick={() => list.fetchNextPage()}
                  size="sm"
                  variant="outline"
                >
                  {list.isFetchingNextPage ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <AgentFeedbackDetailDialog
        isUpdating={updateStatus.isPending}
        item={selectedItem}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
          }
        }}
        onStatusChange={(status) => {
          if (selectedItem) {
            updateStatus.mutate({ feedbackId: selectedItem.id, status });
          }
        }}
        open={selectedItem !== null}
      />
    </PageContainer>
  );
}
