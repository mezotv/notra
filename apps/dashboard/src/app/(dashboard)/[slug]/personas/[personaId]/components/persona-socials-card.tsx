"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { PERSONA_SOCIAL_PLATFORMS } from "@/constants/personas";
import { useSetPersonaSocials } from "@/lib/hooks/use-personas";
import type { PersonaSocialsCardProps } from "@/types/components/personas";
import type { PersonaSocialPlatform } from "@/types/personas";

type SocialUsernames = Record<PersonaSocialPlatform, string>;

function buildUsernames(
  socials: PersonaSocialsCardProps["persona"]["socials"]
): SocialUsernames {
  const usernames: SocialUsernames = {
    twitter: "",
    linkedin: "",
    github: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    website: "",
  };
  for (const social of socials) {
    usernames[social.platform] = social.username;
  }
  return usernames;
}

export function PersonaSocialsCard({
  organizationId,
  persona,
}: PersonaSocialsCardProps) {
  const setSocials = useSetPersonaSocials(organizationId);
  const [usernames, setUsernames] = useState<SocialUsernames>(() =>
    buildUsernames(persona.socials)
  );

  useEffect(() => {
    setUsernames(buildUsernames(persona.socials));
  }, [persona.socials]);

  async function handleSave() {
    const socials = PERSONA_SOCIAL_PLATFORMS.flatMap((platform) => {
      const username = usernames[platform.value].trim();
      if (!username) {
        return [];
      }
      return [
        {
          platform: platform.value,
          username,
          url: platform.profileUrl(username),
        },
      ];
    });

    try {
      await setSocials.mutateAsync({ personaId: persona.id, socials });
      toast.success("Social accounts saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save social accounts"
      );
    }
  }

  return (
    <TitleCard heading="Social Accounts">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Link the persona's public profiles. Leave a field empty to remove it.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PERSONA_SOCIAL_PLATFORMS.map((platform) => (
            <div className="space-y-2" key={platform.value}>
              <Label
                className="flex items-center gap-1.5"
                htmlFor={`social-${platform.value}`}
              >
                <HugeiconsIcon className="size-4" icon={platform.icon} />
                {platform.label}
              </Label>
              <Input
                disabled={setSocials.isPending}
                id={`social-${platform.value}`}
                onChange={(e) =>
                  setUsernames((current) => ({
                    ...current,
                    [platform.value]: e.target.value,
                  }))
                }
                placeholder={platform.placeholder}
                value={usernames[platform.value]}
              />
            </div>
          ))}
        </div>
        <Button
          disabled={setSocials.isPending}
          onClick={handleSave}
          type="button"
        >
          {setSocials.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Social Accounts"
          )}
        </Button>
      </div>
    </TitleCard>
  );
}
