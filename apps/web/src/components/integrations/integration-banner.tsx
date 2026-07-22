import { cn } from "@notra/ui/lib/utils";
import Image from "next/image";
import type { IntegrationBannerProps } from "@/types/integrations";
import { IntegrationLogo } from "./integration-logo";

export function IntegrationBanner({
  integration,
  className,
  priority = false,
}: IntegrationBannerProps) {
  if (integration.bannerUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          alt={`${integration.name} banner`}
          className="object-cover"
          fill
          priority={priority}
          sizes="(max-width: 48rem) 100vw, 40rem"
          src={integration.bannerUrl}
          unoptimized
        />
      </div>
    );
  }

  const brandColor = integration.brandColor ?? "#7C3AED";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-[#EEF0FB] dark:bg-white/[0.04]",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(120deg, ${brandColor}26 0%, ${brandColor}0d 100%)`,
        }}
      />
      <IntegrationLogo
        className="relative flex items-center justify-center"
        integration={integration}
        size={64}
      />
    </div>
  );
}
