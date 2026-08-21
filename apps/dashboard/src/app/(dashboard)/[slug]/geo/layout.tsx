import type { ReactNode } from "react";
import { GeoCatalogWarmer } from "@/components/geo/geo-catalog-warmer";

export default function GeoLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      <GeoCatalogWarmer />
      {children}
      {modal}
    </>
  );
}
