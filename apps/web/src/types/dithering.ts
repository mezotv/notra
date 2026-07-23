import type { DitheringProps } from "@paper-design/shaders-react";
import type { RefObject } from "react";

export type DeferredDitheringProps = Pick<
  DitheringProps,
  "colorBack" | "colorFront" | "scale" | "shape" | "size" | "speed" | "type"
> & {
  className?: string;
};

export interface DitherVisibilityState {
  containerRef: RefObject<HTMLDivElement | null>;
  shouldRender: boolean;
  isAnimating: boolean;
}
