import {
  IMAGE_EXPORT_TARGET_LABELS,
  IMAGE_EXPORT_TARGETS,
} from "@/constants/image-export";
import type { ImageExportTarget } from "@/types/content/image-export";

export function isImageExportTarget(value: string): value is ImageExportTarget {
  return IMAGE_EXPORT_TARGETS.some((target) => target === value);
}

export function getImageExportTargetLabel(target: ImageExportTarget): string {
  return IMAGE_EXPORT_TARGET_LABELS[target];
}
