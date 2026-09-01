"use client";

import Link from "next/link";

import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useGeoProjectScope } from "@/components/providers/geo-project-provider";
import type { GeoWriterNeedsSetupProps } from "@/types/components/geo-writer";
import { withGeoProject } from "@/utils/geo-paths";

export function GeoWriterNeedsSetup({
  organizationSlug,
  title,
  description,
}: GeoWriterNeedsSetupProps) {
  const { projectId } = useGeoProjectScope();

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </header>
        <EmptyState
          action={
            <Button
              nativeButton={false}
              render={
                <Link
                  href={withGeoProject(`/${organizationSlug}/geo`, projectId)}
                />
              }
            >
              Set up GEO tracking
            </Button>
          }
          description="The writer uses your tracked prompts, competitors, and sitemap. Set up GEO tracking first."
          title="Set up GEO tracking"
        />
      </div>
    </PageContainer>
  );
}
