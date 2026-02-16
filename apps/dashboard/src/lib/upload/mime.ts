const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export function getFileExtension(fileType: string) {
  const normalizedMimeType = fileType.split(";")[0]?.trim().toLowerCase();
  if (!normalizedMimeType) {
    return "bin";
  }

  return MIME_EXTENSION_MAP[normalizedMimeType] ?? "bin";
}
