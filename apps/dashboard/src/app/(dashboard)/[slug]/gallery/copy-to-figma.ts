/**
 * Copies HTML to the clipboard as `text/html` so it can be pasted directly into
 * Figma. Figma's "Paste from HTML" support reads the `text/html` clipboard
 * flavor and converts the markup into native layers. A `text/plain` flavor is
 * included as a fallback for editors that don't understand rich clipboard data.
 */
export async function copyHtmlToFigma(html: string): Promise<void> {
  const canWriteRichClipboard =
    typeof ClipboardItem !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.clipboard) &&
    "write" in navigator.clipboard;

  if (canWriteRichClipboard) {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([html], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return;
  }

  await navigator.clipboard.writeText(html);
}

/**
 * Wraps each document's markup in a labelled container and joins them so a
 * single paste drops every document into Figma as separate, named blocks.
 */
export function combineDocumentsForFigma(
  documents: { name: string; content: string }[]
): string {
  return documents
    .map(
      (document) =>
        `<div data-figma-name="${escapeAttribute(document.name)}" style="margin-bottom:48px">${document.content}</div>`
    )
    .join("\n");
}

const AMPERSAND_REGEX = /&/g;
const QUOTE_REGEX = /"/g;
const LESS_THAN_REGEX = /</g;
const GREATER_THAN_REGEX = />/g;

function escapeAttribute(value: string): string {
  return value
    .replace(AMPERSAND_REGEX, "&amp;")
    .replace(QUOTE_REGEX, "&quot;")
    .replace(LESS_THAN_REGEX, "&lt;")
    .replace(GREATER_THAN_REGEX, "&gt;");
}
