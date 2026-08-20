"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { DirectionCockpit } from "@/components/geo/directions/direction-cockpit";
import { DirectionInstrument } from "@/components/geo/directions/direction-instrument";
import { DirectionLeaderboard } from "@/components/geo/directions/direction-leaderboard";
import { DirectionReport } from "@/components/geo/directions/direction-report";
import { PageContainer } from "@/components/layout/container";
import { GEO_DIRECTION_TABS } from "@/constants/geo-directions";

export default function PageClient() {
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-4 px-4 lg:px-6">
        <Tabs defaultValue="instrument">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="font-bold text-3xl tracking-tight">
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
            <DirectionInstrument />
          </TabsContent>
          <TabsContent className="mt-6" value="leaderboard">
            <DirectionLeaderboard />
          </TabsContent>
          <TabsContent className="mt-6" value="cockpit">
            <DirectionCockpit />
          </TabsContent>
          <TabsContent className="mt-6" value="report">
            <DirectionReport />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
