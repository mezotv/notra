"use client";

import { CtaButton } from "@notra/ui/components/shared/cta-button";
import { Badge } from "@notra/ui/components/ui/badge";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Google } from "@notra/ui/components/ui/svgs/google";
import { Loader2Icon } from "lucide-react";
import type {
  AuthSocialButtonsProps,
  SocialProvider,
} from "@/types/auth/form-ui";

const PROVIDERS: {
  provider: SocialProvider;
  label: string;
  Icon: typeof Google;
}[] = [
  { provider: "google", label: "Google", Icon: Google },
  { provider: "github", label: "GitHub", Icon: Github },
];

export function AuthSocialButtons({
  authMethod,
  disabled,
  lastMethod,
  onSelect,
}: AuthSocialButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVIDERS.map(({ provider, label, Icon }) => (
        <div className="relative" key={provider}>
          {lastMethod === provider && (
            <Badge className="-top-4 -right-2 absolute z-10" variant="default">
              Last Used
            </Badge>
          )}
          <CtaButton
            className="w-full"
            disabled={disabled}
            onClick={() => onSelect(provider)}
            type="button"
            variant="light"
          >
            {authMethod === provider ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Icon className="size-4" />
            )}
            {label}
          </CtaButton>
        </div>
      ))}
    </div>
  );
}
