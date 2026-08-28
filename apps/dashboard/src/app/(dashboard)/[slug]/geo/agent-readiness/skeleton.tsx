"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { PageContainer } from "@/components/layout/container";
import {
  AGENT_READINESS_PAGE_DESCRIPTION,
  AGENT_READINESS_PAGE_TITLE,
  AGENT_READINESS_SKELETON_ROW_KEYS,
} from "@/constants/agent-readiness";

export function AgentReadinessSkeleton() {
  const content = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-2xl border p-6">
        <div className="flex items-center gap-6">
          <Skeleton className="size-28 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-8 w-24 self-start rounded-md" />
        </div>
        <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 rounded-2xl border p-5 md:grid-cols-3">
        {AGENT_READINESS_SKELETON_ROW_KEYS.map((key) => (
          <Skeleton className="h-40 w-full rounded-lg" key={key} />
        ))}
      </div>
    </div>
  );

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {AGENT_READINESS_PAGE_TITLE}
          </h1>
          <p className="text-muted-foreground">
            {AGENT_READINESS_PAGE_DESCRIPTION}
          </p>
        </header>
        {content}
      </div>
    </PageContainer>
  );
}
