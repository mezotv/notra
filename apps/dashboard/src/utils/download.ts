import {
  DOWNLOAD_FILENAME_EDGE_DASHES_REGEX,
  DOWNLOAD_FILENAME_INVALID_CHARS_REGEX,
} from "@/constants/download";

export function sanitizeDownloadFilename(filename: string) {
  return filename
    .trim()
    .replace(DOWNLOAD_FILENAME_INVALID_CHARS_REGEX, "-")
    .replace(DOWNLOAD_FILENAME_EDGE_DASHES_REGEX, "")
    .slice(0, 96);
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
