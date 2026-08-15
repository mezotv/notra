import {
  ALLOWED_RASTER_MIME_TYPES,
  MAX_LOGO_FILE_SIZE,
} from "@/constants/upload";

const BYTES_PER_MEGABYTE = 1024 * 1024;

export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_RASTER_MIME_TYPES.some((mimeType) => mimeType === file.type)) {
    return "Please choose a JPEG, PNG, GIF, WebP, or AVIF image.";
  }

  if (file.size > MAX_LOGO_FILE_SIZE) {
    return `Logo image must be less than ${MAX_LOGO_FILE_SIZE / BYTES_PER_MEGABYTE}MB.`;
  }

  return null;
}
