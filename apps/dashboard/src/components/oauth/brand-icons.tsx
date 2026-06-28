import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import type { OAuthBrandIconProps } from "@/types/oauth";

export function CodexIcon({ className }: OAuthBrandIconProps) {
  return <Openai aria-hidden="true" className={className} />;
}

export function ClaudeIcon({ className }: OAuthBrandIconProps) {
  return <ClaudeAiIcon aria-hidden="true" className={className} />;
}
