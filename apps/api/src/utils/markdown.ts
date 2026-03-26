import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const TITLE_REGEX = /^#\s+(.+)$/m;

export function extractTitleFromMarkdown(markdown: string): string | null {
  const titleMatch = markdown.match(TITLE_REGEX);
  return titleMatch?.[1]?.trim() || null;
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const html = await marked.parse(markdown);

  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "a",
      "strong",
      "em",
      "del",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "div",
      "span",
      "sup",
      "sub",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      pre: ["class"],
      td: ["align"],
      th: ["align"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.target === "_blank") {
          attribs.rel = "noopener noreferrer";
        }

        return { tagName, attribs };
      },
    },
  });
}
