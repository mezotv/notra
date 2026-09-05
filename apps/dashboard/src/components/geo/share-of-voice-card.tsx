"use client";

import {
  GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  GEO_SHARE_OF_VOICE_TRACKING_HINT,
} from "@notra/geo-core/constants/geo";
import type { ShareOfVoiceRow } from "@notra/geo-core/types/geo";
import { POSTHOG_EVENTS } from "@notra/posthog/events";

import { ShareOfVoiceTable } from "@/components/geo/share-of-voice-table";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { trackEvent } from "@/lib/analytics/posthog-client";
import { useGeoCompetitorRowNavigation } from "@/lib/hooks/use-geo";
import type { ShareOfVoiceCardProps } from "@/types/geo";
import { isOwnBrandName } from "@/utils/geo-competitors";

export function ShareOfVoiceCard({
  points,
  timeseries = GEO_EMPTY_COMPETITOR_SHARE_TIMESERIES,
  competitors,
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
  const openRow = (row: ShareOfVoiceRow) => {
    trackEvent(POSTHOG_EVENTS.GEO_SHARE_OF_VOICE_SLICE_CLICKED, {
      is_own_brand: isOwnBrandName(row.brand, companyName, aliases),
      is_other: row.brand === CHART_OTHER_SLICE_LABEL,
      share: row.share,
      mentions: row.mentions,
    });
    navigation.openRow(row.brand);
  };
  const prefetchRow = (row: ShareOfVoiceRow) =>
    navigation.prefetchRow(row.brand);

  return (
    <InstrumentSection
      bodyClassName="flex min-h-0 flex-1 flex-col"
      className="h-full"
      eyebrow="Share of voice"
      hint={GEO_SHARE_OF_VOICE_TRACKING_HINT}
    >
      <ShareOfVoiceTable
        aliases={aliases}
        companyName={companyName}
        competitors={competitors}
        isScanning={isScanning}
        onRowClick={organizationSlug ? openRow : undefined}
        onRowPointerEnter={organizationSlug ? prefetchRow : undefined}
        points={points}
        timeseries={timeseries}
      />
    </InstrumentSection>
  );
}
