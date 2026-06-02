import type { ImageContentData } from "@/types/content/image";

const HTTP_URL_RE = /^https?:\/\//i;
const GENERATED_IMAGE_PLACEHOLDER_PREFIX = "<p>Generated image:";

export function getImageArtifactHtml(sourceMetadata: unknown): string | null {
  if (
    !sourceMetadata ||
    typeof sourceMetadata !== "object" ||
    Array.isArray(sourceMetadata)
  ) {
    return null;
  }

  const artifacts = (sourceMetadata as { artifacts?: unknown }).artifacts;
  if (!artifacts || typeof artifacts !== "object" || Array.isArray(artifacts)) {
    return null;
  }

  const html = (artifacts as { html?: unknown }).html;
  return typeof html === "string" && html.trim() ? html : null;
}

export function getImageExportHtml(content: ImageContentData): string | null {
  if (content.rawHtml?.trim()) {
    return content.rawHtml;
  }

  const persistedHtml = content.content.trim();
  if (
    persistedHtml.startsWith("<") &&
    !persistedHtml.startsWith(GENERATED_IMAGE_PLACEHOLDER_PREFIX)
  ) {
    return persistedHtml;
  }

  return getImageArtifactHtml(content.sourceMetadata);
}

export function isHttpImageContent(content: string): boolean {
  return HTTP_URL_RE.test(content);
}
