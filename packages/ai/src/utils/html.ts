const EMBEDDED_IMAGE_DATA_URL_RE =
  /^data:image\/(?:png|jpeg|jpg|gif|webp);base64,/i;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeMarkdownAlt(value: string) {
  return value.replace(/[\\[\]]/g, "\\$&");
}

export function buildGeneratedImageMarkdown(params: {
  title: string;
  pngBase64: string;
}) {
  return `![${escapeMarkdownAlt(params.title)}](data:image/png;base64,${params.pngBase64})`;
}

export function buildGeneratedImageHtmlPlaceholder(title: string) {
  return `<p>Generated image: ${escapeHtml(title)}</p>`;
}

export function isEmbeddedImageDataUrl(value: string) {
  return EMBEDDED_IMAGE_DATA_URL_RE.test(value);
}
