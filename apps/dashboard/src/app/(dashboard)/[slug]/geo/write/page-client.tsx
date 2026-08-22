"use client";

import { useFlag } from "@databuddy/sdk/react";
import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useCallback, useState } from "react";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { BriefHistory } from "@/components/geo/writer/brief-history";
import {
  GeoWriterNeedsSetup,
  GeoWriterUnavailable,
} from "@/components/geo/writer/page-gate";
import { WriteDialog } from "@/components/geo/writer/write-dialog";
import { PageContainer } from "@/components/layout/container";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import { GEO_GAPS_NAV_LINK, GEO_WRITER_FLAG_KEY } from "@/constants/geo";
import { useGeoSettings } from "@/lib/hooks/use-geo";
import { useGeoWriterBriefs } from "@/lib/hooks/use-geo-writer";
import type {
  GeoWriterPageContentProps,
  WriteDialogInitialState,
} from "@/types/components/geo-writer";
import type { GeoPageClientProps } from "@/types/geo";
import { emptyWriteDialogState, geoContentPath } from "@/utils/geo-write-entry";
import { isGeoWriterVisibleInNav } from "@/utils/geo-writer-flag";
import { GeoWriterSkeleton } from "./skeleton";

export default function PageClient({ organizationSlug }: GeoPageClientProps) {
  const [projectParam] = useQueryState("project", parseAsString);

  return (
    <GeoProjectProvider projectId={projectParam ?? undefined}>
      <GeoWriterPageContent organizationSlug={organizationSlug} />
    </GeoProjectProvider>
  );
}

function GeoWriterPageContent({ organizationSlug }: GeoWriterPageContentProps) {
  const router = useRouter();
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const writerFlag = useFlag(GEO_WRITER_FLAG_KEY);
  const writerVisible = isGeoWriterVisibleInNav(writerFlag.on);

  const { data: settingsData, isPending: isSettingsPending } =
    useGeoSettings(organizationId);
  const briefsQuery = useGeoWriterBriefs(organizationId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] =
    useState<WriteDialogInitialState | null>(null);

  const gapsHref = `/${organizationSlug}${GEO_GAPS_NAV_LINK}`;

  const openDialog = useCallback((initial?: WriteDialogInitialState) => {
    setDialogInitial(initial ?? emptyWriteDialogState());
    setDialogOpen(true);
  }, []);

  if (!writerVisible) {
    return <GeoWriterUnavailable />;
  }

  if (!(isSettingsPending || settingsData?.settings)) {
    return (
      <GeoWriterNeedsSetup
        description="Plan a custom article from a prompt, type, brand, and competitors"
        organizationSlug={organizationSlug}
        title="Write"
      />
    );
  }

  if (isSettingsPending && !briefsQuery.data) {
    return <GeoWriterSkeleton />;
  }

  const briefs = briefsQuery.data?.briefs ?? [];
  let history: ReactNode;
  if (briefsQuery.isPending) {
    history = <GeoWriterSkeleton embedded />;
  } else if (briefs.length === 0) {
    history = (
      <EmptyState
        action={
          <Button className="gap-1.5" onClick={() => openDialog()}>
            <HugeiconsIcon className="size-4" icon={PencilEdit01Icon} />
            New article
          </Button>
        }
        description="Start from a custom topic. After you approve the brief, the draft opens in Content."
        preview={
          <EmptyStateTablePreview
            columns={EMPTY_STATE_TABLE_COLUMNS.write}
            rows={EMPTY_STATE_TABLE_ROWS}
          />
        }
        title="No articles yet"
      />
    );
  } else {
    history = (
      <BriefHistory
        briefs={briefs}
        onOpen={(briefId) => {
          const summary = briefs.find((brief) => brief.id === briefId);
          if (summary?.postId) {
            router.push(geoContentPath(organizationSlug, summary.postId));
          }
        }}
      />
    );
  }

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="font-bold text-3xl tracking-tight">Write</h1>
            <p className="text-muted-foreground">
              Custom topics open a brief dialog. Questions engines already
              answer without you live on{" "}
              <Link
                className="underline underline-offset-4 hover:text-foreground"
                href={gapsHref}
              >
                Content Gaps
              </Link>
              .
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => openDialog()}>
            <HugeiconsIcon className="size-4" icon={PencilEdit01Icon} />
            New article
          </Button>
        </header>

        {history}
      </div>

      {organizationId ? (
        <WriteDialog
          initial={dialogInitial}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
        />
      ) : null}
    </PageContainer>
  );
}
