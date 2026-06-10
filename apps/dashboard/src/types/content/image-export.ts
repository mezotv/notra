import type { IMAGE_EXPORT_TARGETS } from "@/constants/image-export";

export type ImageExportTarget = (typeof IMAGE_EXPORT_TARGETS)[number];

export interface ImageExportTargetIconProps {
  target: ImageExportTarget;
  className?: string;
}
