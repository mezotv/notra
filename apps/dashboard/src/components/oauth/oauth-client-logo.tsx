import { Robot01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import type { OAuthClientLogoProps } from "@/types/oauth";
import { ClaudeIcon, CodexIcon } from "./brand-icons";

const BRAND_IMAGES = {
  hermes: "/brands/hermes.png",
  openclaw: "/brands/openclaw.png",
} as const;

export function OAuthClientLogo({
  brandId,
  name,
  className,
}: OAuthClientLogoProps) {
  const containerClassName = cn(
    "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background",
    className
  );

  if (brandId === "codex") {
    return (
      <span className={containerClassName}>
        <CodexIcon className="size-7 text-foreground" />
      </span>
    );
  }

  if (brandId === "claude") {
    return (
      <span className={containerClassName}>
        <ClaudeIcon className="size-7 text-foreground" />
      </span>
    );
  }

  if (brandId === "hermes" || brandId === "openclaw") {
    return (
      <span className={cn(containerClassName, "bg-white")}>
        <Image
          alt={`${name} logo`}
          className="size-full object-cover"
          height={48}
          src={BRAND_IMAGES[brandId]}
          width={48}
        />
      </span>
    );
  }

  return (
    <span className={containerClassName}>
      <HugeiconsIcon
        className="size-6 text-muted-foreground"
        icon={Robot01Icon}
      />
    </span>
  );
}
