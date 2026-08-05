"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import Link from "next/link";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { AddCompetitorDialog } from "@/components/geo/add-competitor-dialog";
import { CompetitorShareCard } from "@/components/geo/competitor-share-card";
import { CompetitorsTable } from "@/components/geo/competitors-table";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  useGeoCompetitorShare,
  useGeoCompetitors,
  useGeoSettings,
} from "@/lib/hooks/use-geo";
import { GeoPageSkeleton } from "../skeleton";

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const { data: settingsData, isPending } = useGeoSettings(organizationId);
  const { data: competitorShare } = useGeoCompetitorShare(organizationId);
  const { data: competitorList } = useGeoCompetitors(organizationId);
  const [managerOpen, setManagerOpen] = useState(false);

  useHotkey("C", () => setManagerOpen(true), { enabled: !managerOpen });

  if (isPending) {
    return <GeoPageSkeleton />;
  }

  const settings = settingsData?.settings ?? null;

  if (!settings) {
    return (
      <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="w-full space-y-6 px-4 lg:px-6">
          <header className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Competitors</h1>
            <p className="text-muted-foreground">
              Who AI engines recommend instead of you
            </p>
          </header>
          <EmptyState
            action={
              <Link
                className="text-primary text-sm underline underline-offset-4"
                href={`/${organizationSlug}/geo`}
              >
                Set up GEO tracking
              </Link>
            }
            description="Set up GEO tracking first, then track which competitors AI engines surface."
            title="Not set up yet"
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Competitors</h1>
            <p className="text-muted-foreground">
              Who AI engines recommend instead of you
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setManagerOpen(true)}>
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add Competitor
            <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
          </Button>
        </header>
        <CompetitorsTable
          aliases={settings.aliases}
          companyName={settings.companyName}
          competitors={competitorList?.competitors ?? []}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
        <CompetitorShareCard
          companyName={settings.companyName}
          competitors={competitorList?.competitors}
          points={competitorShare?.points ?? []}
        />
      </div>
      <AddCompetitorDialog
        onOpenChange={setManagerOpen}
        open={managerOpen}
        organizationId={organizationId}
      />
    </PageContainer>
  );
}
