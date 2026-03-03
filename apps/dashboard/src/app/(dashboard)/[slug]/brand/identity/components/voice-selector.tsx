import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import type { VoiceSelectorProps } from "../types/brand-identity";
import {
  getBrandFaviconUrl,
  getWebsiteDisplayText,
} from "../utils/brand-identity";

export function VoiceSelector({
  voices,
  activeVoiceId,
  onSelect,
}: VoiceSelectorProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {voices.map((voice) => (
        <button
          className={`flex min-w-40 shrink-0 cursor-pointer gap-2 rounded-lg border px-4 py-3 text-left transition-colors ${
            voice.id === activeVoiceId
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
          key={voice.id}
          onClick={() => onSelect(voice.id)}
          type="button"
        >
          <Avatar className="size-8 rounded-full after:rounded-full" size="sm">
            <AvatarImage src={getBrandFaviconUrl(voice.websiteUrl)} />
            <AvatarFallback>
              {voice.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="block truncate font-medium text-sm leading-tight">
                {voice.name}
              </span>
              {(voice.toneProfile || voice.isDefault) && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="inline-flex shrink-0 cursor-help text-muted-foreground transition-colors hover:text-foreground">
                        <HugeiconsIcon
                          className="size-3.5"
                          icon={InformationCircleIcon}
                        />
                      </span>
                    }
                  />
                  <TooltipContent className="space-y-1">
                    {voice.toneProfile && (
                      <p>Tone Profile: {voice.toneProfile}</p>
                    )}
                    {voice.isDefault && (
                      <p>
                        Default brand identity used when no specific identity is
                        selected.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {voice.websiteUrl && (
              <p className="truncate text-muted-foreground text-xs italic">
                {getWebsiteDisplayText(voice.websiteUrl)}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
