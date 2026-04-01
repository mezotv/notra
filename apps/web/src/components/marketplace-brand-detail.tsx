import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MarketplaceBrand } from "~types/marketplace";
import { CompanyLogoWithFallback } from "./marketplace-icons";
import { MarketplaceReferenceCard } from "./marketplace-reference-card";

const VOICE_FIELDS = [
  { key: "toneProfile", label: "Tone" },
  { key: "audience", label: "Audience" },
  { key: "language", label: "Language" },
  { key: "customTone", label: "Custom Tone" },
] as const;

export function MarketplaceBrandDetail({ brand }: { brand: MarketplaceBrand }) {
  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <CompanyLogoWithFallback
            accentColor={brand.accentColor}
            name={brand.companyName}
            size={48}
            websiteUrl={brand.websiteUrl}
          />
          <div className="flex flex-col gap-0.5">
            <h1 className="font-semibold font-serif text-2xl sm:text-3xl">
              {brand.companyName}
            </h1>
            <a
              className="inline-flex items-center gap-1 font-sans text-muted-foreground/60 text-sm transition-colors hover:text-foreground"
              href={`${brand.websiteUrl}?utm_source=usenotra.com`}
              rel="noreferrer"
              target="_blank"
            >
              {new URL(brand.websiteUrl).hostname}
              <HugeiconsIcon className="size-3.5" icon={ArrowUpRight01Icon} />
            </a>
          </div>
        </div>
        {brand.companyDescription && (
          <p className="max-w-2xl text-muted-foreground">
            {brand.companyDescription}
          </p>
        )}
      </div>

      {/* Brand Voice */}
      <section className="flex flex-col gap-4">
        <h2 className="font-medium font-sans text-lg">Brand Voice</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {VOICE_FIELDS.map(({ key, label }) => {
            const value = brand[key];
            if (!value) return null;
            return (
              <div
                className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/50 px-4 py-3"
                key={key}
              >
                <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  {label}
                </span>
                <span className="text-sm">{value}</span>
              </div>
            );
          })}
        </div>
        {brand.customInstructions && (
          <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/50 px-4 py-3">
            <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Custom Instructions
            </span>
            <p className="whitespace-pre-wrap text-sm">
              {brand.customInstructions}
            </p>
          </div>
        )}
      </section>

      {/* References */}
      {brand.references.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-medium font-sans text-lg">
            References{" "}
            <span className="text-muted-foreground">
              ({brand.references.length})
            </span>
          </h2>
          <div className="columns-1 gap-4 space-y-4 sm:columns-2">
            {brand.references.map((ref) => (
              <MarketplaceReferenceCard key={ref.id} reference={ref} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
