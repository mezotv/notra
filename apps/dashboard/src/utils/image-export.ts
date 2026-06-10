import { IMAGE_EXPORT_TARGETS } from "@/constants/image-export";
import type { ImageExportTarget } from "@/types/content/image-export";

export function isImageExportTarget(value: string): value is ImageExportTarget {
  return IMAGE_EXPORT_TARGETS.includes(value as ImageExportTarget);
}

export function getImageExportTargetLabel(target: ImageExportTarget): string {
  switch (target) {
    case "figma":
      return "Figma";
    case "wonder":
      return "Wonder";
    case "paper":
      return "Paper";
  }
}
