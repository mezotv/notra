import type { Metadata } from "next";
import { Suspense } from "react";
import { db } from "@notra/db/drizzle";
import { marketplaceBrands } from "@notra/db/schema";
import { type SQL, and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { ChangelogPageHeader } from "@/components/changelog-page-header";
import { MarketplaceCard } from "@/components/marketplace-card";
import { MarketplaceCategoryTabs } from "@/components/marketplace-category-tabs";
import { MarketplaceSearch } from "@/components/marketplace-search";
import { MARKETPLACE_DISCLAIMER } from "@/utils/marketplace";
import type { MarketplaceBrowsePageProps } from "~types/marketplace";

const title = "Brand Identity Marketplace";
const description =
  "Explore how top companies define their brand voice, tone, and content style. Browse curated brand identities with real references.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://usenotra.com/marketplace",
  },
  openGraph: {
    title,
    description,
    url: "https://usenotra.com/marketplace",
    type: "website",
    siteName: "Notra",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

async function MarketplaceGrid({ category, query }: { category?: string; query?: string }) {
  const conditions: SQL[] = [];

  if (category && category !== "all") {
    conditions.push(eq(marketplaceBrands.category, category));
  }

  if (query) {
    const pattern = `%${query}%`;
    const searchCondition = or(
      ilike(marketplaceBrands.companyName, pattern),
      ilike(marketplaceBrands.companyDescription, pattern),
      ilike(marketplaceBrands.category, pattern),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const brands = await db.query.marketplaceBrands.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(marketplaceBrands.featured), asc(marketplaceBrands.companyName)],
  });

  const mapped = brands.map((brand) => ({
    ...brand,
    referenceCount: Array.isArray(brand.references)
      ? (brand.references as unknown[]).length
      : 0,
    references: brand.references as never[],
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString(),
  }));

  if (mapped.length === 0) {
    return (
      <div className="mt-14 flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">
          No brand identities found for this category.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {mapped.map((brand) => (
        <MarketplaceCard brand={brand} key={brand.id} />
      ))}
    </div>
  );
}

export default async function MarketplaceBrowsePage({
  searchParams,
}: MarketplaceBrowsePageProps) {
  const { category, q } = await searchParams;

  return (
    <>
      <ChangelogPageHeader
        description={
          <>
            Explore how top companies define their brand voice,
            <br className="hidden sm:block" />
            tone, and content style.
          </>
        }
        title={
          <>
            Brand Identity{" "}
            <span className="text-primary">Marketplace</span>
          </>
        }
      />

      <div className="mt-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Suspense>
          <MarketplaceCategoryTabs />
        </Suspense>
        <Suspense>
          <MarketplaceSearch />
        </Suspense>
      </div>

      <MarketplaceGrid category={category} query={q} />

      <p className="mt-8 text-center font-sans text-muted-foreground text-xs">
        {MARKETPLACE_DISCLAIMER}
      </p>
    </>
  );
}
