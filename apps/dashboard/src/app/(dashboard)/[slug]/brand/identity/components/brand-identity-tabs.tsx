"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import type { BrandIdentityTabsProps, BrandTab } from "@/types/brand-identity";
import { BrandForm } from "./brand-form";
import { GuidelinesPanel } from "./guidelines-panel";
import { ReferencesList } from "./references-list";
import { SitemapList } from "./sitemap-list";

export function BrandIdentityTabs({
  activeTab,
  addReferenceOpen,
  addSitemapOpen,
  initialData,
  onActiveTabChange,
  onAddReferenceOpenChange,
  onAddSitemapOpenChange,
  onSavedAtChange,
  onSavingChange,
  organizationId,
  referenceCount,
  saveStatusText,
  sitemapCount,
  voiceId,
  voiceWebsiteUrl,
}: BrandIdentityTabsProps) {
  return (
    <Tabs
      onValueChange={(value) => onActiveTabChange(value as BrandTab)}
      value={activeTab}
    >
      <div className="flex items-center justify-between">
        <TabsList variant="line">
          <TabsTrigger value="identity">Company Info</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          <TabsTrigger value="references">
            References
            {referenceCount > 0 && (
              <span className="text-muted-foreground">({referenceCount})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sitemap">
            Sitemap
            {sitemapCount > 0 && (
              <span className="text-muted-foreground">({sitemapCount})</span>
            )}
          </TabsTrigger>
        </TabsList>
        {activeTab === "identity" && (
          <span className="text-muted-foreground text-xs">
            {saveStatusText}
          </span>
        )}
      </div>

      <TabsContent className="mt-6" value="identity">
        <BrandForm
          initialData={initialData}
          key={voiceId}
          onSavedAtChange={onSavedAtChange}
          onSavingChange={onSavingChange}
          organizationId={organizationId}
          voiceId={voiceId}
        />
      </TabsContent>

      <TabsContent className="mt-6" value="guidelines">
        <GuidelinesPanel
          key={`guidelines-${voiceId}`}
          organizationId={organizationId}
          voiceId={voiceId}
        />
      </TabsContent>

      <TabsContent className="mt-6" value="references">
        <ReferencesList
          dialogOpen={addReferenceOpen}
          key={`refs-${voiceId}`}
          onDialogOpenChange={onAddReferenceOpenChange}
          organizationId={organizationId}
          voiceId={voiceId}
        />
      </TabsContent>

      <TabsContent className="mt-6" value="sitemap">
        <SitemapList
          dialogOpen={addSitemapOpen}
          key={`sitemap-${voiceId}`}
          onDialogOpenChange={onAddSitemapOpenChange}
          organizationId={organizationId}
          voiceId={voiceId}
          voiceWebsiteUrl={voiceWebsiteUrl}
        />
      </TabsContent>
    </Tabs>
  );
}
