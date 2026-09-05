export type DesignSystemTickLevel = "group" | "section";

export interface DesignSystemCatalogItem {
  id: string;
  label: string;
  href: string;
  level: DesignSystemTickLevel;
}
