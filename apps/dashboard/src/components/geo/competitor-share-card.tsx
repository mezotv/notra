"use client";

import {
  GEO_SHARE_OF_VOICE_PAGE_TOP_BRANDS,
  GEO_SHARE_OF_VOICE_TRACKING_HINT,
} from "@notra/geo-core/constants/geo";
import type { ShareOfVoiceRow } from "@notra/geo-core/types/geo";

import { ShareOfVoiceDonut } from "@/components/geo/share-of-voice-donut";
import { InstrumentSection } from "@/components/instrument/instrument-module";
import { CHART_OTHER_SLICE_LABEL } from "@/constants/charts";
import { useGeoCompetitorRowNavigation } from "@/lib/hooks/use-geo";
import type { CompetitorShareCardProps } from "@/types/geo";

export function CompetitorShareCard({
  points,
  companyName,
  aliases,
  competitors,
  isScanning = false,
  organizationSlug,
  organizationId,
}: CompetitorShareCardProps) {
  const navigation = useGeoCompetitorRowNavigation(
    organizationSlug,
    organizationId
  );

  const openRow = (row: ShareOfVoiceRow) => {
    if (row.brand === CHART_OTHER_SLICE_LABEL) {
      return;
    }
    navigation.openRow(row.brand);
  };

  const prefetchRow = (row: ShareOfVoiceRow) => {
    if (row.brand === CHART_OTHER_SLICE_LABEL) {
      return;
    }
    navigation.prefetchRow(row.brand);
  };

  return (
    <InstrumentSection
      description={
        <>
          <span className="block">
            {companyName
              ? `Brands AI engines bring up alongside ${companyName}`
              : "Brands AI engines bring up"}
          </span>
          <span className="block">{GEO_SHARE_OF_VOICE_TRACKING_HINT}</span>
        </>
      }
      eyebrow="Share of voice"
    >
      <ShareOfVoiceDonut
        aliases={aliases}
        companyName={companyName}
        competitors={competitors}
        isScanning={isScanning}
        limit={GEO_SHARE_OF_VOICE_PAGE_TOP_BRANDS}
        onSliceClick={organizationSlug ? openRow : undefined}
        onSlicePointerEnter={organizationSlug ? prefetchRow : undefined}
        organizationId={organizationId}
        points={points}
      />
    </InstrumentSection>
  );
}
