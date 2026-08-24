import { Suspense } from "react";
import { GeoCatalogWarmer } from "@/components/geo/geo-catalog-warmer";
import { GeoUpgradeGate } from "@/components/geo/geo-upgrade-gate";
import { GeoProjectQueryProvider } from "@/components/providers/geo-project-provider";
import type { GeoLayoutProps } from "@/types/geo";

export default async function GeoLayout({
  children,
  modal,
  params,
}: GeoLayoutProps) {
  const { slug } = await params;
  return (
    <>
      <GeoCatalogWarmer organizationSlug={slug} />
      <Suspense fallback={children}>
        <GeoProjectQueryProvider>
          <GeoUpgradeGate slug={slug}>
            {children}
            {modal}
          </GeoUpgradeGate>
        </GeoProjectQueryProvider>
      </Suspense>
    </>
  );
}
