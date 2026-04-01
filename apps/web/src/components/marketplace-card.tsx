import { TitleCard } from "@notra/ui/components/ui/title-card";
import Link from "next/link";
import type { MarketplaceBrand } from "~types/marketplace";
import { CompanyLogoWithFallback } from "./marketplace-icons";

const CATEGORY_LABELS: Record<string, string> = {
  payments: "Payments",
  email: "Email",
  cloud: "Cloud",
  devtools: "DevTools",
};

export function MarketplaceCard({ brand }: { brand: MarketplaceBrand }) {
  return (
    <Link
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={`/marketplace/${brand.slug}`}
    >
      <TitleCard
        accentColor={brand.accentColor ?? undefined}
        action={
          <div className="flex items-center gap-1.5">
            {brand.category && CATEGORY_LABELS[brand.category] && (
              <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground text-xs">
                {CATEGORY_LABELS[brand.category]}
              </span>
            )}
            <span className="rounded-full border border-border px-2.5 py-0.5 text-muted-foreground text-xs">
              {brand.referenceCount}{" "}
              {brand.referenceCount === 1 ? "Ref" : "Refs"}
            </span>
          </div>
        }
        className="h-full cursor-pointer transition-colors hover:bg-muted/80"
        heading={brand.companyName}
        icon={
          <CompanyLogoWithFallback
            accentColor={brand.accentColor}
            name={brand.companyName}
            size={20}
            websiteUrl={brand.websiteUrl}
          />
        }
      >
        <p className="line-clamp-2 text-muted-foreground text-sm">
          {brand.companyDescription}
        </p>
      </TitleCard>
    </Link>
  );
}
