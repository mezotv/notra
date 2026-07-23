import { DeferredDithering } from "@/components/deferred-dithering";
import type { HeroDitherProps } from "@/types/landing/hero";

export function HeroDither({ className }: HeroDitherProps) {
  return (
    <DeferredDithering
      className={className}
      colorBack="#00000000"
      colorFront="#8B5CF633"
      scale={0.53}
      shape="wave"
      size={2.9}
      speed={0.53}
      type="4x4"
    />
  );
}
