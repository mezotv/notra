import {
  DOWNLOAD_FILENAME_EDGE_DASHES_REGEX,
  DOWNLOAD_FILENAME_EXTENSION_REGEX,
  DOWNLOAD_FILENAME_INVALID_CHARS_REGEX,
} from "@/constants/download";

export function sanitizeDownloadFilename(filename: string) {
  return filename
    .trim()
    .replace(DOWNLOAD_FILENAME_INVALID_CHARS_REGEX, "-")
    .replace(DOWNLOAD_FILENAME_EDGE_DASHES_REGEX, "")
    .slice(0, 96);
}

export function imageExtensionFromMediaType(mediaType: string) {
  const [baseMediaType = ""] = mediaType.toLowerCase().split(";");
  switch (baseMediaType.trim()) {
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return undefined;
  }
}

export function buildImageDownloadFilename(
  baseName: string,
  mediaType: string,
  fallbackExtension?: string
) {
  if (DOWNLOAD_FILENAME_EXTENSION_REGEX.test(baseName)) {
    return baseName;
  }

  const extension = imageExtensionFromMediaType(mediaType) ?? fallbackExtension;
  return extension ? `${baseName}.${extension}` : baseName;
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
