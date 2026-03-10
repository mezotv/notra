import type { ReactNode } from "react";

export interface ShowcaseCompany {
  slug: string;
  name: string;
  domain: string;
  description: string;
  url: string;
  accentColor: string;
}

export interface ShowcaseOverviewCard {
  slug: string;
  name: string;
  description: string;
  accentColor: string;
  entryCount: number;
  icon: ReactNode;
}

export interface ShowcaseOverviewGridProps {
  companies: ShowcaseOverviewCard[];
}

export interface ShowcaseCompanyPageProps {
  params: Promise<{ name: string }>;
}

export interface ShowcaseEntryPageProps {
  params: Promise<{ name: string; slug: string }>;
}
