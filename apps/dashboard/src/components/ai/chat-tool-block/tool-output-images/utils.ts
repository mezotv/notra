import {
  buildImageDownloadFilename,
  downloadBlob,
  imageExtensionFromMediaType,
  sanitizeDownloadFilename,
} from "@/utils/download";
import {
  DATA_IMAGE_URL_REGEX,
  GENERIC_URL_KEYS,
  HTTP_URL_REGEX,
  IMAGE_CONTAINER_KEYS,
  IMAGE_DATA_KEYS,
  IMAGE_EXTENSION_REGEX,
  IMAGE_SPECIFIC_URL_KEYS,
  LEADING_DOT_REGEX,
  URL_SUFFIX_REGEX,
} from "./constants";
import type { ToolOutputImage } from "./types";

function getImageDownloadFilename(image: ToolOutputImage, mediaType: string) {
  const baseName =
    sanitizeDownloadFilename(image.filename ?? "tool-output-image") ||
    "tool-output-image";
  return buildImageDownloadFilename(
    baseName,
    mediaType,
    imageExtensionFromMediaType(image.mediaType)
  );
}

export async function downloadToolOutputImage(image: ToolOutputImage) {
  try {
    const response = await fetch(image.url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const blob = await response.blob();
    downloadBlob(blob, getImageDownloadFilename(image, blob.type));
  } catch {
    window.open(image.url, "_blank", "noopener,noreferrer");
  }
}

function isImageMediaType(value: unknown): value is string {
  return typeof value === "string" && value.toLowerCase().startsWith("image/");
}

function getStringField(
  record: Record<string, unknown>,
  keys: readonly string[]
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function toImageUrl(value: string, mediaType?: string) {
  if (DATA_IMAGE_URL_REGEX.test(value)) {
    return value;
  }
  if (HTTP_URL_REGEX.test(value)) {
    return value;
  }
  if (mediaType && isImageMediaType(mediaType)) {
    return `data:${mediaType};base64,${value}`;
  }
  return undefined;
}

function inferImageMediaType(url: string) {
  const match = url.match(IMAGE_EXTENSION_REGEX);
  if (!match) {
    return undefined;
  }

  const extension = match[0]
    .replace(LEADING_DOT_REGEX, "")
    .replace(URL_SUFFIX_REGEX, "");
  if (extension === "jpg") {
    return "image/jpeg";
  }
  if (extension === "svg") {
    return "image/svg+xml";
  }
  return `image/${extension}`;
}

export function collectToolOutputImages(
  value: unknown,
  images: ToolOutputImage[] = [],
  seen = new Set<string>(),
  depth = 0
): ToolOutputImage[] {
  if (value == null || depth > 5) {
    return images;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectToolOutputImages(item, images, seen, depth + 1);
    }
    return images;
  }

  if (typeof value !== "object") {
    return images;
  }

  const record = value as Record<string, unknown>;
  const mediaType = getStringField(record, ["mediaType", "mimeType"]);
  const filename = getStringField(record, ["filename", "name", "title"]);
  const imageSpecificUrl = getStringField(record, IMAGE_SPECIFIC_URL_KEYS);
  const genericUrl = getStringField(record, GENERIC_URL_KEYS);
  const rawUrl = imageSpecificUrl ?? genericUrl;
  const rawData = getStringField(record, IMAGE_DATA_KEYS);
  const url =
    (rawUrl ? toImageUrl(rawUrl, mediaType) : undefined) ??
    (rawData ? toImageUrl(rawData, mediaType) : undefined);
  const inferredMediaType =
    mediaType ?? (url ? inferImageMediaType(url) : undefined);

  if (
    url &&
    (Boolean(imageSpecificUrl) ||
      isImageMediaType(inferredMediaType) ||
      DATA_IMAGE_URL_REGEX.test(url))
  ) {
    const key = `${inferredMediaType ?? "image"}:${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      images.push({
        url,
        mediaType: inferredMediaType ?? "image/*",
        filename,
      });
    }
  }

  for (const key of IMAGE_CONTAINER_KEYS) {
    collectToolOutputImages(record[key], images, seen, depth + 1);
  }

  return images;
}
