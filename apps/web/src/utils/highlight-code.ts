import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { createHighlighter } from "shiki";

const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
} as const;

const SHIKI_LANGS = [
  "bash",
  "css",
  "diff",
  "go",
  "html",
  "java",
  "javascript",
  "json",
  "jsx",
  "markdown",
  "php",
  "python",
  "ruby",
  "rust",
  "sql",
  "toml",
  "tsx",
  "typescript",
  "yaml",
] as const;

const PLAINTEXT_LANG = "text";

const CODE_BLOCK_REGEX =
  /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/g;
const LANGUAGE_CLASS_REGEX = /(?:language|lang)-([\w-]+)/;

const HTML_ENTITY_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#0?39;/g, "'"],
  [/&#x27;/gi, "'"],
  [/&amp;/g, "&"],
];

const SVG_ATTRIBUTE_CASE_REGEX = /[A-Z]/g;

function iconToSvg(icon: typeof Copy01Icon, className: string) {
  const children = icon
    .map(([tag, attributes]) => {
      const serializedAttributes = Object.entries(attributes)
        .reduce<string[]>((acc, [attributeName, value]) => {
          if (attributeName !== "key") {
            acc.push(
              `${attributeName.replace(
                SVG_ATTRIBUTE_CASE_REGEX,
                (char) => `-${char.toLowerCase()}`
              )}="${value}"`
            );
          }
          return acc;
        }, [])
        .join(" ");

      return `<${tag} ${serializedAttributes} />`;
    })
    .join("");

  return `<svg aria-hidden="true" class="${className}" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">${children}</svg>`;
}

const COPY_BUTTON_HTML = `<button aria-label="Copy code" class="code-copy-button" data-copy-code type="button">${iconToSvg(
  Copy01Icon,
  "code-copy-icon"
)}${iconToSvg(Tick02Icon, "code-copy-icon-success")}</button>`;

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
      langs: [...SHIKI_LANGS],
    });
  }
  return highlighterPromise;
}

function decodeHtmlEntities(value: string) {
  let decoded = value;
  for (const [pattern, replacement] of HTML_ENTITY_REPLACEMENTS) {
    decoded = decoded.replace(pattern, replacement);
  }
  return decoded;
}

function resolveLanguage(attributes: string, loadedLangs: ReadonlySet<string>) {
  const match = attributes.match(LANGUAGE_CLASS_REGEX);
  const requested = match?.[1]?.toLowerCase();

  if (requested && loadedLangs.has(requested)) {
    return requested;
  }

  return PLAINTEXT_LANG;
}

export async function highlightCodeBlocks(html: string): Promise<string> {
  if (!html.includes("<pre")) {
    return html;
  }

  const highlighter = await getHighlighter();
  const loadedLangs = new Set(highlighter.getLoadedLanguages());

  return html.replace(
    CODE_BLOCK_REGEX,
    (block, preAttributes: string, codeAttributes: string, code: string) => {
      const lang = resolveLanguage(
        `${codeAttributes} ${preAttributes}`,
        loadedLangs
      );

      try {
        const highlighted = highlighter.codeToHtml(decodeHtmlEntities(code), {
          lang,
          themes: SHIKI_THEMES,
        });

        return `<div class="code-block">${COPY_BUTTON_HTML}${highlighted}</div>`;
      } catch {
        return block;
      }
    }
  );
}
