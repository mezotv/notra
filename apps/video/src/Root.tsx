import { Composition } from "remotion";
import { ImageGenLaunch } from "./image-gen-launch";
import { TOTAL_DURATION, VIDEO } from "./lib/theme";

export function RemotionRoot() {
  return (
    <Composition
      component={ImageGenLaunch}
      durationInFrames={TOTAL_DURATION}
      fps={VIDEO.fps}
      height={VIDEO.height}
      id="ImageGenLaunch"
      width={VIDEO.width}
    />
  );
}
