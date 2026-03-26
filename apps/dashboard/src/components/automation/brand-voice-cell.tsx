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
import type { BrandSettings } from "@/types/hooks/brand-analysis";
import { getBrandFaviconUrl } from "@/utils/brand";

export function BrandVoiceCell({
  voice,
  isDefault,
}: {
  voice?: BrandSettings;
  isDefault?: boolean;
}) {
  if (!voice) {
    return <span className="text-muted-foreground/50">&mdash;</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help truncate text-sm">
        {voice.name}
        {isDefault && (
          <span className="ml-1 text-muted-foreground/60 text-xs">
            (Default)
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="flex items-start gap-3" side="top">
        <Avatar
          className="mt-0.5 size-8 shrink-0 rounded-full after:rounded-full"
          size="sm"
        >
          <AvatarImage src={getBrandFaviconUrl(voice.websiteUrl)} />
          <AvatarFallback className="text-xs">
            {voice.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-0.5">
          <p className="font-medium">{voice.name}</p>
          {voice.toneProfile && <p>Tone: {voice.toneProfile}</p>}
          {voice.language && <p>Language: {voice.language}</p>}
          {voice.companyName && <p>Company: {voice.companyName}</p>}
          {isDefault && (
            <p className="text-muted-foreground">Default identity</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
