import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Figma } from "@notra/ui/components/ui/svgs/figma";
import { Paper } from "@notra/ui/components/ui/svgs/paper";
import type { ImageExportTargetIconProps } from "@/types/content/image-export";

export function ImageExportTargetIcon({
  target,
  className,
}: ImageExportTargetIconProps) {
  switch (target) {
    case "figma":
      return <Figma className={className} />;
    case "wonder":
      return <HugeiconsIcon className={className} icon={SparklesIcon} />;
    case "paper":
      return <Paper className={className} />;
    default:
      return <Paper className={className} />;
  }
}
