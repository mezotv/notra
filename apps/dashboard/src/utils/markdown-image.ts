import { isEmbeddedImageDataUrl } from "@notra/ai/utils/html";

const MARKDOWN_IMAGE_RE = /!\[[^\]]*]\((data:image\/[^)]+)\)/;
const HTML_IMAGE_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;
const HTTP_URL_RE = /^https?:\/\//i;

export function extractMarkdownImageSrc(markdown: string): string | null {
  const markdownMatch = markdown.match(MARKDOWN_IMAGE_RE);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }

  const htmlMatch = markdown.match(HTML_IMAGE_SRC_RE);
  if (htmlMatch?.[1] && isEmbeddedImageDataUrl(htmlMatch[1])) {
    return htmlMatch[1];
  }

  return null;
}

export function resolveImagePreviewSrc(params: {
  content: string;
  markdown: string | null;
}): string | null {
  if (HTTP_URL_RE.test(params.content)) {
    return params.content;
  }

  return extractMarkdownImageSrc(params.markdown ?? "");
}
