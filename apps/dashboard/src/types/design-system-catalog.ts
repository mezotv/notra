export type DesignSystemTickLevel = "group" | "section";

export interface DesignSystemCatalogItem {
  id: string;
  number: string;
  label: string;
  href: string;
  level: DesignSystemTickLevel;
}
