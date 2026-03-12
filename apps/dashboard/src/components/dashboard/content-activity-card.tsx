"use client";

import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from "@notra/ui/components/kibo-ui/contribution-graph";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { cn } from "@notra/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { ContentPublishingMetricsData } from "@/types/dashboard";

interface ActivityEntry {
  date: string;
  count: number;
  drafts: number;
  published: number;
  level: number;
}

import { QUERY_KEYS } from "@/utils/query-keys";
import { useOrganizationsContext } from "../providers/organization-provider";

const numberFormatter = new Intl.NumberFormat("en-US");

export const ContentActivityCard = () => {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;

  const { data, isPending } = useQuery({
    queryKey: organizationId
      ? QUERY_KEYS.POSTS.metrics(organizationId)
      : ["content-metrics", "disabled"],
    queryFn: async (): Promise<ContentPublishingMetricsData> => {
      const response = await fetch(
        `/api/organizations/${organizationId}/content/metrics`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch content metrics");
      }
      return response.json();
    },
    enabled: Boolean(organizationId),
    meta: { errorMessage: "Failed to load content activity" },
  });

  if (isPending) {
    return <Skeleton className="h-40 w-full max-w-[53rem] rounded-lg" />;
  }

  return (
    <div className="w-fit rounded-lg border border-border/80 bg-background px-4 py-3">
      {data?.graph?.activity ? (
        <ContributionGraph
          blockMargin={3}
          blockSize={13}
          data={data.graph.activity}
          fontSize={12}
        >
          <ContributionGraphCalendar>
            {({ activity, dayIndex, weekIndex }) => {
              const entry = activity as unknown as ActivityEntry;

              return (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <g>
                        <ContributionGraphBlock
                          activity={activity}
                          className={cn(
                            'data-[level="0"]:fill-muted dark:data-[level="0"]:fill-white/5',
                            'data-[level="1"]:fill-primary/20 dark:data-[level="1"]:fill-primary/30',
                            'data-[level="2"]:fill-primary/40 dark:data-[level="2"]:fill-primary/50',
                            'data-[level="3"]:fill-primary/60 dark:data-[level="3"]:fill-primary/70',
                            'data-[level="4"]:fill-primary/80 dark:data-[level="4"]:fill-primary/90'
                          )}
                          dayIndex={dayIndex}
                          weekIndex={weekIndex}
                        />
                      </g>
                    }
                  />
                  <TooltipContent className="space-y-1.5">
                    <p className="font-semibold">
                      {format(parseISO(entry.date), "MMMM d, yyyy")}
                    </p>
                    <p className="font-medium text-sm">
                      {entry.count} {entry.count === 1 ? "post" : "posts"}
                    </p>
                    {entry.count > 0 && (
                      <div className="flex gap-3 text-muted-foreground text-xs">
                        <span>
                          {entry.drafts}{" "}
                          {entry.drafts === 1 ? "draft" : "drafts"}
                        </span>
                        <span>{entry.published} published</span>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }}
          </ContributionGraphCalendar>
          <ContributionGraphFooter>
            <ContributionGraphTotalCount>
              {({ totalCount }) => (
                <span className="text-muted-foreground text-sm">
                  <span className="font-semibold text-foreground">
                    {totalCount.toLocaleString()}
                  </span>{" "}
                  posts (
                  <span className="font-semibold text-foreground">
                    {numberFormatter.format(data.drafts)}
                  </span>{" "}
                  {data.drafts === 1 ? "draft" : "drafts"} /{" "}
                  <span className="font-semibold text-foreground">
                    {numberFormatter.format(data.published)}
                  </span>{" "}
                  published)
                </span>
              )}
            </ContributionGraphTotalCount>
            <ContributionGraphLegend>
              {({ level }) => (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <div
                        className={cn(
                          "h-3 w-3 rounded-sm border border-border",
                          level === 0 && "bg-muted dark:bg-white/5",
                          level === 1 && "bg-primary/20 dark:bg-primary/30",
                          level === 2 && "bg-primary/40 dark:bg-primary/50",
                          level === 3 && "bg-primary/60 dark:bg-primary/70",
                          level === 4 && "bg-primary/80 dark:bg-primary/90"
                        )}
                      />
                    }
                  />
                  <TooltipContent>Level {level}</TooltipContent>
                </Tooltip>
              )}
            </ContributionGraphLegend>
          </ContributionGraphFooter>
        </ContributionGraph>
      ) : (
        <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
          No content activity data available
        </div>
      )}
    </div>
  );
};

export { ContentActivityCard as PublishingActivityCard };
