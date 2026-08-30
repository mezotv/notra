import { MentionRateCard } from "@/components/geo/mention-rate-card";
import { MentionTrendCard } from "@/components/geo/mention-trend-card";
import {
  DESIGN_SYSTEM_GEO_OVERVIEW,
  DESIGN_SYSTEM_GEO_POINTS,
  DESIGN_SYSTEM_GEO_TRACKED_ENGINES,
} from "@/constants/design-system-geo";

export default function GeoDemoPage() {
  return (
    <main className="bg-muted/30 min-h-screen p-8 lg:p-12">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <MentionRateCard
            engines={DESIGN_SYSTEM_GEO_OVERVIEW}
            timeseriesPoints={DESIGN_SYSTEM_GEO_POINTS}
            trackedEngines={DESIGN_SYSTEM_GEO_TRACKED_ENGINES}
          />
        </div>
        <div className="h-[430px] lg:col-span-7">
          <MentionTrendCard points={DESIGN_SYSTEM_GEO_POINTS} />
        </div>
      </div>
    </main>
  );
}
