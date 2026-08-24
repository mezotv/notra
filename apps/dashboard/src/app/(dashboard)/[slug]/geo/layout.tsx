import { Suspense } from "react";
import { GeoCatalogWarmer } from "@/components/geo/geo-catalog-warmer";
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
          {children}
          {modal}
        </GeoProjectQueryProvider>
      </Suspense>
    </>
  );
}
