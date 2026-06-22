"use client";

import {
  ArrowDown01Icon,
  Comment01Icon,
  CorporateIcon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@notra/ui/components/ui/sidebar";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { useReferences } from "@/lib/hooks/use-brand-references";
import { cn } from "@/lib/utils";

const STORAGE_VERSION = "v1";

function storageKey(organizationId: string) {
  return `notra:brand-identity:${STORAGE_VERSION}:${organizationId}`;
}

function readStoredVoiceId(organizationId: string) {
  try {
    return localStorage.getItem(storageKey(organizationId));
  } catch {
    return null;
  }
}

function writeStoredVoiceId(organizationId: string, voiceId: string) {
  try {
    localStorage.setItem(storageKey(organizationId), voiceId);
  } catch {
    // Ignore storage failures (private mode, quota, disabled).
  }
}

export function NavBrandIdentity({ slug }: { slug: string }) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const { data, isPending } = useBrandSettings(organizationId);
  const voices = data?.voices ?? [];

  const brandBasePath = `/${slug}/brand/identity`;
  const isOnBrandPage = pathname === brandBasePath;
  const voiceParam = searchParams.get("voice");
  const isReferencesView =
    isOnBrandPage && searchParams.get("view") === "references";

  const [storedVoiceId, setStoredVoiceId] = useState<string | null>(null);
  useEffect(() => {
    if (organizationId) {
      setStoredVoiceId(readStoredVoiceId(organizationId));
    }
  }, [organizationId]);

  const activeVoice =
    (voiceParam ? voices.find((v) => v.id === voiceParam) : undefined) ??
    (storedVoiceId ? voices.find((v) => v.id === storedVoiceId) : undefined) ??
    voices.find((v) => v.isDefault) ??
    voices[0];
  const activeVoiceId = activeVoice?.id;

  // Keep the persisted identity in sync when it changes via the page URL.
  useEffect(() => {
    if (
      organizationId &&
      isOnBrandPage &&
      voiceParam &&
      voices.some((v) => v.id === voiceParam)
    ) {
      writeStoredVoiceId(organizationId, voiceParam);
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

  function handleSelectVoice(voiceId: string) {
    writeStoredVoiceId(organizationId, voiceId);
    setStoredVoiceId(voiceId);
    const viewSuffix = isReferencesView ? "&view=references" : "";
    router.push(`${brandBasePath}?voice=${voiceId}${viewSuffix}`);
  }

  // Icon-collapsed sidebar: show a single entry that links to the page.
  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isOnBrandPage}
                render={
                  <Link href={companyInfoHref}>
                    <HugeiconsIcon icon={CorporateIcon} />
                    <span>Brand Identity</span>
                  </Link>
                }
                tooltip="Brand Identity"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Brand Identity</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            {voices.length === 0 ? (
              isPending && !data ? (
                <div className="flex h-8 items-center gap-2 rounded-md px-2">
                  <Skeleton className="size-4 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ) : (
                <SidebarMenuButton
                  isActive={isOnBrandPage}
                  render={
                    <Link href={brandBasePath}>
                      <HugeiconsIcon icon={CorporateIcon} />
                      <span>Set up brand identity</span>
                    </Link>
                  }
                />
              )
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton className="cursor-pointer data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground">
                      <HugeiconsIcon icon={CorporateIcon} />
                      <span className="truncate font-medium">
                        {activeVoice?.name}
                      </span>
                      <HugeiconsIcon
                        className="ml-auto text-muted-foreground"
                        icon={ArrowDown01Icon}
                      />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent
                  align="start"
                  className="min-w-56 rounded-lg"
                  side="bottom"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Brand identities</DropdownMenuLabel>
                    {voices.map((voice) => (
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 pr-8"
                        key={voice.id}
                        onClick={() => handleSelectVoice(voice.id)}
                      >
                        <HugeiconsIcon
                          className="size-4 text-muted-foreground"
                          icon={CorporateIcon}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {voice.name}
                        </span>
                        {voice.isDefault ? (
                          <Badge
                            className="shrink-0 px-1.5 py-0 font-medium text-[10px]"
                            variant="secondary"
                          >
                            Default
                          </Badge>
                        ) : null}
                        {activeVoiceId === voice.id ? (
                          <HugeiconsIcon
                            className="absolute right-2 size-4 text-muted-foreground"
                            icon={Tick02Icon}
                          />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => router.push(`${brandBasePath}?new=1`)}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} />
                    Create identity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {voices.length > 0 ? (
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={isOnBrandPage && !isReferencesView}
                    render={
                      <Link href={companyInfoHref}>
                        <HugeiconsIcon icon={CorporateIcon} />
                        <span>Company Info</span>
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    isActive={isReferencesView}
                    render={
                      <Link href={referencesHref}>
                        <HugeiconsIcon icon={Comment01Icon} />
                        <span>References</span>
                        {referenceCount > 0 ? (
                          <span
                            className={cn(
                              "ml-auto text-muted-foreground text-xs tabular-nums"
                            )}
                          >
                            {referenceCount}
                          </span>
                        ) : null}
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            ) : null}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
