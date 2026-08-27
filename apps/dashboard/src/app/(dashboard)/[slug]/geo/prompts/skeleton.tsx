"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { Button } from "@/components/button";
import { GeoTableSkeleton } from "@/components/geo/skeleton-parts";
import { PageContainer } from "@/components/layout/container";

const PROMPT_ROW_COUNT = 6;

export function GeoPromptsSkeleton() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Prompts</h1>
            <p className="text-muted-foreground">
              The questions we ask AI engines on your behalf
            </p>
          </div>
          <Button className="gap-1.5">
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add Prompt
            <Kbd className="ml-1 hidden sm:inline-flex">P</Kbd>
          </Button>
        </header>
        <Skeleton className="h-18 w-full rounded-xl" />
        <Skeleton className="h-18 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-9 w-full rounded-md sm:max-w-72" />
          <GeoTableSkeleton rows={PROMPT_ROW_COUNT} />
        </div>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Conversations</p>
              <p className="text-muted-foreground text-sm">
                Multi-turn questions where buying decisions happen
              </p>
            </div>
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
          <GeoTableSkeleton rows={2} />
        </div>
      </div>
    </PageContainer>
  );
}
