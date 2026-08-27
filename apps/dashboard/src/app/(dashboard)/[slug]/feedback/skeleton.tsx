import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@notra/ui/components/ui/tabs";

import { PageContainer } from "@/components/layout/container";
import {
  AGENT_FEEDBACK_SKELETON_ROWS,
  AGENT_FEEDBACK_STATUS_FILTERS,
} from "@/constants/agent-feedback";

export function AgentFeedbackPageSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="text-muted-foreground">
            What AI agents are saying about your product.
          </p>
        </div>
        <Tabs defaultValue="all">
          <TabsList variant="line">
            {AGENT_FEEDBACK_STATUS_FILTERS.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="border-border/80 bg-background overflow-hidden rounded-lg border">
          <div className="bg-muted/40 flex h-10 items-center gap-4 border-b px-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-12" />
          </div>
          {AGENT_FEEDBACK_SKELETON_ROWS.map((row) => (
            <div
              className="border-border/60 flex h-13 items-center gap-4 border-t px-4"
              key={row}
            >
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <div className="ml-auto">
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
