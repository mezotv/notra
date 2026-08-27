"use client";

import {
  Comment01Icon,
  CorporateIcon,
  GlobalIcon,
  PaintBoardIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { useReferences } from "@/lib/hooks/use-brand-references";
import { useSitemaps } from "@/lib/hooks/use-brand-sitemaps";
import {
  findSelectedBrandIdentity,
  readStoredBrandIdentityId,
} from "@/utils/brand-identity-selection";

import { SidebarLabel } from "./sidebar-label";

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerStoredVoiceId(): string | null {
  return null;
}

export function NavBrandIdentity({ slug }: { slug: string }) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data } = useBrandSettings(organizationId);
  const voices = data?.voices ?? [];

  const brandBasePath = `/${slug}/brand/identity`;
  const isOnBrandPage = pathname === brandBasePath;
  const voiceParam = searchParams.get("voice");
  const currentView = searchParams.get("view");
  const isReferencesView = isOnBrandPage && currentView === "references";
  const isSitemapView = isOnBrandPage && currentView === "sitemap";
  const isGuidelinesView = isOnBrandPage && currentView === "guidelines";

  const storedVoiceId = useSyncExternalStore(
    subscribeToStorage,
    () => (organizationId ? readStoredBrandIdentityId(organizationId) : null),
    getServerStoredVoiceId
  );

  const activeVoice = findSelectedBrandIdentity(
    voices,
    voiceParam,
    storedVoiceId
  );
  const activeVoiceId = activeVoice?.id;

  const { data: referencesData } = useReferences(
    organizationId,
    activeVoiceId ?? ""
  );
  const referenceCount = referencesData?.references.length ?? 0;

  const { data: sitemapsData } = useSitemaps(
    organizationId,
    activeVoiceId ?? ""
  );
  const sitemapCount = sitemapsData?.sitemaps.length ?? 0;

  if (!organizationId) {
    return null;
  }

  const companyInfoHref = activeVoiceId
    ? `${brandBasePath}?voice=${activeVoiceId}`
    : brandBasePath;
  const referencesHref = activeVoiceId
    ? `${brandBasePath}?voice=${activeVoiceId}&view=references`
    : `${brandBasePath}?view=references`;
  const sitemapHref = activeVoiceId
    ? `${brandBasePath}?voice=${activeVoiceId}&view=sitemap`
    : `${brandBasePath}?view=sitemap`;
  const guidelinesHref = activeVoiceId
    ? `${brandBasePath}?voice=${activeVoiceId}&view=guidelines`
    : `${brandBasePath}?view=guidelines`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <SidebarLabel>Brand Identity</SidebarLabel>
      </SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={
              isOnBrandPage &&
              !isReferencesView &&
              !isSitemapView &&
              !isGuidelinesView
            }
            render={
              <Link href={companyInfoHref} replace>
                <HugeiconsIcon icon={CorporateIcon} />
                <SidebarLabel>Company Info</SidebarLabel>
              </Link>
            }
            tooltip="Company Info"
          />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isGuidelinesView}
            render={
              <Link href={guidelinesHref} replace>
                <HugeiconsIcon icon={PaintBoardIcon} />
                <SidebarLabel>Brand Guidelines</SidebarLabel>
              </Link>
            }
            tooltip="Brand Guidelines"
          />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isReferencesView}
            render={
              <Link href={referencesHref} replace>
                <HugeiconsIcon icon={Comment01Icon} />
                <SidebarLabel>References</SidebarLabel>
                {referenceCount > 0 ? (
                  <span className="text-muted-foreground ml-auto text-xs tabular-nums group-data-[collapsible=icon]:hidden">
                    {referenceCount}
                  </span>
                ) : null}
              </Link>
            }
            tooltip="References"
          />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isSitemapView}
            render={
              <Link href={sitemapHref} replace>
                <HugeiconsIcon icon={GlobalIcon} />
                <SidebarLabel>Sitemap</SidebarLabel>
                {sitemapCount > 0 ? (
                  <span className="text-muted-foreground ml-auto text-xs tabular-nums group-data-[collapsible=icon]:hidden">
                    {sitemapCount}
                  </span>
                ) : null}
              </Link>
            }
            tooltip="Sitemap"
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
