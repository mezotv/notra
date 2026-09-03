"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import dynamic from "next/dynamic";
import { useState } from "react";

import { PageContainer } from "@/components/layout/container";
import { GEO_DIRECTION_TABS } from "@/constants/geo-directions";
import type { GeoDirectionKey } from "@/types/geo-directions";

const directionLoading = () => (
  <div aria-label="Loading GEO direction" role="status">
    <Skeleton aria-hidden className="min-h-96 w-full rounded-2xl" />
  </div>
);

const DirectionInstrument = dynamic(
  () =>
    import("@/components/geo/directions/direction-instrument").then(
      (module) => module.DirectionInstrument
    ),
  { loading: directionLoading }
);
const DirectionLeaderboard = dynamic(
  () =>
    import("@/components/geo/directions/direction-leaderboard").then(
      (module) => module.DirectionLeaderboard
    ),
  { loading: directionLoading }
);
const DirectionCockpit = dynamic(
  () =>
    import("@/components/geo/directions/direction-cockpit").then(
      (module) => module.DirectionCockpit
    ),
  { loading: directionLoading }
);
const DirectionReport = dynamic(
  () =>
    import("@/components/geo/directions/direction-report").then(
      (module) => module.DirectionReport
    ),
  { loading: directionLoading }
);

export default function PageClient() {
  const [activeTab, setActiveTab] = useState<GeoDirectionKey>("instrument");

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-4 px-4 lg:px-6">
        <Tabs
          onValueChange={(value) => setActiveTab(value as GeoDirectionKey)}
          value={activeTab}
        >
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                GEO directions
              </h1>
              <p className="text-muted-foreground text-sm">
                Four layouts of the same GEO overview, seeded with static data.
              </p>
            </div>
            <TabsList variant="line">
              {GEO_DIRECTION_TABS.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </header>

          <TabsContent className="mt-6" value="instrument">
            {activeTab === "instrument" ? <DirectionInstrument /> : null}
          </TabsContent>
          <TabsContent className="mt-6" value="leaderboard">
            {activeTab === "leaderboard" ? <DirectionLeaderboard /> : null}
          </TabsContent>
          <TabsContent className="mt-6" value="cockpit">
            {activeTab === "cockpit" ? <DirectionCockpit /> : null}
          </TabsContent>
          <TabsContent className="mt-6" value="report">
            {activeTab === "report" ? <DirectionReport /> : null}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
