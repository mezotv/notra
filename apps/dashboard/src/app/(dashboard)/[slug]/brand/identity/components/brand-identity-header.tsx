"use client";

import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Kbd } from "@notra/ui/components/ui/kbd";
import { Button } from "@/components/button";
import { BRAND_TAB_HEADERS } from "../constants/brand-identity";

type BrandTab = "identity" | "references" | "sitemap";

interface BrandIdentityHeaderProps {
  activeTab: BrandTab;
  onAddIdentity: () => void;
  onAddReference: () => void;
  onAddSitemap: () => void;
}

export function BrandIdentityHeader({
  activeTab,
  onAddIdentity,
  onAddReference,
  onAddSitemap,
}: BrandIdentityHeaderProps) {
  const actionByTab = {
    identity: {
      label: "Create Identity",
      onClick: onAddIdentity,
    },
    references: {
      label: "Create Reference",
      onClick: onAddReference,
    },
    sitemap: {
      label: "Add Sitemap",
      onClick: onAddSitemap,
    },
  } satisfies Record<BrandTab, { label: string; onClick: () => void }>;
  const action = actionByTab[activeTab];

  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <h1 className="font-bold text-3xl tracking-tight">
          {BRAND_TAB_HEADERS[activeTab].title}
        </h1>
        <p className="text-muted-foreground">
          {BRAND_TAB_HEADERS[activeTab].description}
        </p>
      </div>
      <Button className="gap-1.5" onClick={action.onClick}>
        <HugeiconsIcon className="size-4" icon={Add01Icon} />
        {action.label}
        <Kbd className="ml-1 hidden sm:inline-flex">C</Kbd>
      </Button>
    </div>
  );
}
