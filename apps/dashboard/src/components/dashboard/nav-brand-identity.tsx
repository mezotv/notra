"use client";

import { Comment01Icon, CorporateIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@notra/ui/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { useReferences } from "@/lib/hooks/use-brand-references";
import {
  readStoredBrandIdentityId,
  writeStoredBrandIdentityId,
} from "@/utils/brand-identity-selection";
import { CollapsibleSidebarGroup } from "./collapsible-nav-group";

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
  const isReferencesView =
    isOnBrandPage && searchParams.get("view") === "references";

  const [storedVoiceId, setStoredVoiceId] = useState<string | null>(null);
  useEffect(() => {
    if (organizationId) {
      setStoredVoiceId(readStoredBrandIdentityId(organizationId));
    }
  }, [organizationId]);

  const activeVoice =
    (voiceParam ? voices.find((v) => v.id === voiceParam) : undefined) ??
    (storedVoiceId ? voices.find((v) => v.id === storedVoiceId) : undefined) ??
    voices.find((v) => v.isDefault) ??
    voices[0];
  const activeVoiceId = activeVoice?.id;

  useEffect(() => {
    if (
      organizationId &&
      isOnBrandPage &&
      voiceParam &&
      voices.some((v) => v.id === voiceParam)
    ) {
      writeStoredBrandIdentityId(organizationId, voiceParam);
      setStoredVoiceId(voiceParam);
    }
  }, [organizationId, isOnBrandPage, voiceParam, voices]);

  const { data: referencesData } = useReferences(
    organizationId,
    activeVoiceId ?? ""
  );
  const referenceCount = referencesData?.references.length ?? 0;

  if (!organizationId) {
    return null;
  }

  const companyInfoHref = activeVoiceId
    ? `${brandBasePath}?voice=${activeVoiceId}`
    : brandBasePath;
  const referencesHref = activeVoiceId
    ? `${brandBasePath}?voice=${activeVoiceId}&view=references`
    : `${brandBasePath}?view=references`;

  return (
    <CollapsibleSidebarGroup label="Brand Identity">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isOnBrandPage && !isReferencesView}
            render={
              <Link href={companyInfoHref}>
                <HugeiconsIcon icon={CorporateIcon} />
                <span>Company Info</span>
              </Link>
            }
            tooltip="Company Info"
          />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isReferencesView}
            render={
              <Link href={referencesHref}>
                <HugeiconsIcon icon={Comment01Icon} />
                <span>References</span>
                {referenceCount > 0 ? (
                  <span className="ml-auto text-muted-foreground text-xs tabular-nums group-data-[collapsible=icon]:hidden">
                    {referenceCount}
                  </span>
                ) : null}
              </Link>
            }
            tooltip="References"
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </CollapsibleSidebarGroup>
  );
}
