import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@notra/db/drizzle";
import { marketplaceBrands } from "@notra/db/schema";
import { eq } from "drizzle-orm";
import { MarketplaceBrandDetail } from "@/components/marketplace-brand-detail";
import { MARKETPLACE_DISCLAIMER } from "@/utils/marketplace";
import type { MarketplaceReference } from "~types/marketplace";

interface MarketplaceDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getBrand(slug: string) {
  const brand = await db.query.marketplaceBrands.findFirst({
    where: eq(marketplaceBrands.slug, slug),
  });

  if (!brand) return null;

  return {
    ...brand,
    references: (brand.references ?? []) as MarketplaceReference[],
    referenceCount: Array.isArray(brand.references)
      ? (brand.references as unknown[]).length
      : 0,
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString(),
  };
}

export async function generateMetadata({
  params,
}: MarketplaceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrand(slug);

  if (!brand) return {};

  const title = { absolute: `${brand.companyName} Brand Identity` };
  const description = `${brand.companyDescription ?? brand.companyName} — Explore their brand voice, tone profile, and content references on Notra.`;
  const url = `https://usenotra.com/marketplace/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: title.absolute,
      description,
      url,
      type: "website",
      siteName: "Notra",
    },
    twitter: {
      card: "summary_large_image",
      title: title.absolute,
      description,
    },
  };
}

export default async function MarketplaceDetailPage({
  params,
}: MarketplaceDetailPageProps) {
  const { slug } = await params;
  const brand = await getBrand(slug);

  if (!brand) {
    notFound();
  }

  return (
    <>
      <Link
        className="inline-flex items-center gap-1 font-sans text-foreground/50 text-sm transition-colors hover:text-foreground"
        href="/marketplace"
      >
        &larr; All brands
      </Link>

      <div className="mt-8">
        <MarketplaceBrandDetail brand={brand} />
      </div>

      <p className="mt-12 text-center font-sans text-muted-foreground text-xs">
        {MARKETPLACE_DISCLAIMER}
      </p>
    </>
  );
}
