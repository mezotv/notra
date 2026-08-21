"use client";

import { ShareOfVoiceTable } from "@/components/geo/share-of-voice-table";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { useGeoCompetitorRowNavigation } from "@/lib/hooks/use-geo";
import type { ShareOfVoiceCardProps, ShareOfVoiceRow } from "@/types/geo";

export function ShareOfVoiceCard({
  points,
  competitors,
  action,
  isScanning = false,
  organizationSlug,
  organizationId,
  companyName,
  aliases,
}: ShareOfVoiceCardProps) {
  const navigation = useGeoCompetitorRowNavigation(
    organizationSlug,
    organizationId
  );
  const openRow = (row: ShareOfVoiceRow) => navigation.openRow(row.brand);
  const prefetchRow = (row: ShareOfVoiceRow) =>
    navigation.prefetchRow(row.brand);

  return (
    <InstrumentSection
      action={action}
      bodyClassName="flex min-h-0 flex-1 flex-col"
      className="h-full"
      eyebrow="Share of voice"
    >
      <ShareOfVoiceTable
        aliases={aliases}
        companyName={companyName}
        competitors={competitors}
        isScanning={isScanning}
        onRowClick={organizationSlug ? openRow : undefined}
        onRowPointerEnter={organizationSlug ? prefetchRow : undefined}
        points={points}
      />
    </InstrumentSection>
  );
}
