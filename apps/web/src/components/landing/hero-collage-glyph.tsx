import {
  Blockchain04Icon,
  Image01Icon,
  News01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { XTwitter } from "@notra/ui/components/ui/svgs/twitter";
import { cn } from "@notra/ui/lib/utils";
import type { HeroCollageGlyphType } from "@/types/landing/hero-collage";

const GLYPH_CLASS = "size-4";

export function HeroCollageGlyph({ type }: { type: HeroCollageGlyphType }) {
  if (type === "twitter_post") {
    return <XTwitter className={cn(GLYPH_CLASS, "text-foreground")} />;
  }
  if (type === "changelog") {
    return (
      <HugeiconsIcon
        className={cn(GLYPH_CLASS, "text-violet-500 dark:text-violet-300")}
        icon={Blockchain04Icon}
      />
    );
  }
  if (type === "blog_post") {
    return (
      <HugeiconsIcon
        className={cn(GLYPH_CLASS, "text-emerald-500 dark:text-emerald-300")}
        icon={News01Icon}
      />
    );
  }
  return (
    <HugeiconsIcon
      className={cn(GLYPH_CLASS, "text-fuchsia-400")}
      icon={Image01Icon}
    />
  );
}
