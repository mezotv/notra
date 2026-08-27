import { Figma } from "@notra/ui/components/ui/svgs/figma";
import { Paper } from "@notra/ui/components/ui/svgs/paper";
import { Wonder } from "@notra/ui/components/ui/svgs/wonder";

import type { ImageExportTargetIconProps } from "@/types/content/image-export";

export function ImageExportTargetIcon({
  target,
  className,
}: ImageExportTargetIconProps) {
  switch (target) {
    case "figma":
      return <Figma className={className} />;
    case "wonder":
      return <Wonder className={className} />;
    case "paper":
      return <Paper className={className} />;
    default:
      return <Paper className={className} />;
  }
}
