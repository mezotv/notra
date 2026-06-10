export const DATA_IMAGE_URL_REGEX = /^data:image\/[a-z0-9.+-]+;base64,/i;
export const HTTP_URL_REGEX = /^https?:\/\//i;
export const IMAGE_EXTENSION_REGEX =
  /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i;
export const LEADING_DOT_REGEX = /^[.]/;
export const URL_SUFFIX_REGEX = /[?#].*$/;
export const IMAGE_SPECIFIC_URL_KEYS = [
  "image_url",
  "imageUrl",
  "thumbnail_url",
  "thumbnailUrl",
  "src",
  "image",
] as const;
export const GENERIC_URL_KEYS = ["url", "uri", "href"] as const;
export const IMAGE_DATA_KEYS = ["data", "blob", "base64", "image"] as const;
export const IMAGE_CONTAINER_KEYS = [
  "content",
  "contents",
  "structuredContent",
  "images",
  "files",
  "artifacts",
  "result",
  "results",
] as const;
