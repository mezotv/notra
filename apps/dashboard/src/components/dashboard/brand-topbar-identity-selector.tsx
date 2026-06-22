"use client";

import {
  ArrowDown01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Badge } from "@notra/ui/components/ui/badge";
import { BreadcrumbPage } from "@notra/ui/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { getBrandFaviconUrl } from "@/utils/brand";
import {
  findSelectedBrandIdentity,
  readStoredBrandIdentityId,
  writeStoredBrandIdentityId,
} from "@/utils/brand-identity-selection";

function BrandIdentityAvatar({
  name,
  websiteUrl,
}: {
  name: string;
  websiteUrl: string | null;
}) {
  return (
    <Avatar className="size-4 after:rounded-full" size="sm">
      <AvatarImage src={getBrandFaviconUrl(websiteUrl)} />
      <AvatarFallback className="text-[9px]">
        {name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function BrandTopbarIdentitySelector({ slug }: { slug: string }) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data } = useBrandSettings(organizationId);
  const voices = data?.voices ?? [];
  const voiceParam = searchParams.get("voice");
  const isReferencesView = searchParams.get("view") === "references";
  const [storedVoiceId, setStoredVoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) {
      setStoredVoiceId(readStoredBrandIdentityId(organizationId));
    }
  }, [organizationId]);

  const activeVoice = findSelectedBrandIdentity(
    voices,
    voiceParam,
    storedVoiceId
  );

  const brandBasePath = `/${slug}/brand/identity`;
  const viewSuffix = isReferencesView ? "&view=references" : "";

  function handleSelectVoice(voiceId: string) {
    writeStoredBrandIdentityId(organizationId, voiceId);
    setStoredVoiceId(voiceId);
    router.push(`${brandBasePath}?voice=${voiceId}${viewSuffix}`);
  }

  if (voices.length === 0 || !activeVoice) {
    return (
      <BreadcrumbPage className="block min-w-0 truncate">
        Company Info
      </BreadcrumbPage>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="-mx-1.5 flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 font-normal text-foreground outline-none transition-colors hover:bg-accent data-popup-open:bg-accent"
            type="button"
          >
            <BrandIdentityAvatar
              name={activeVoice.name}
              websiteUrl={activeVoice.websiteUrl}
            />
            <span className="truncate">{activeVoice.name}</span>
            <HugeiconsIcon
              className="size-3.5 shrink-0 text-muted-foreground"
              icon={ArrowDown01Icon}
            />
          </button>
        }
      />
      <DropdownMenuContent
        align="start"
        className="min-w-52 rounded-lg"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Brand identities</DropdownMenuLabel>
          {voices.map((voice) => (
            <DropdownMenuItem
              className="cursor-pointer gap-2 pr-8"
              key={voice.id}
              onClick={() => handleSelectVoice(voice.id)}
            >
              <BrandIdentityAvatar
                name={voice.name}
                websiteUrl={voice.websiteUrl}
              />
              <span className="min-w-0 flex-1 truncate">{voice.name}</span>
              {voice.isDefault ? (
                <Badge
                  className="shrink-0 px-1.5 py-0 font-medium text-[10px]"
                  variant="secondary"
                >
                  Default
                </Badge>
              ) : null}
              {activeVoice.id === voice.id ? (
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
  );
}
