import { GeoCatalogWarmer } from "@/components/geo/geo-catalog-warmer";
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
      {children}
      {modal}
    </>
  );
}
