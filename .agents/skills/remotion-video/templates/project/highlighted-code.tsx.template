import { useEffect, useState, useMemo } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
import { codeToHtml, type BundledLanguage, type BundledTheme, type ThemeRegistrationAny } from "shiki";
import { brandShikiTheme } from "./shiki-theme";

/**
 * Renders syntax-highlighted code with optional per-line emphasis and
 * error-line coloring.
 *
 * `emphasizedLines` (1-indexed): the lines the viewer should focus on. All
 * other lines render at 0.22 opacity with a slight blur, and opacity/filter
 * transitions animate at 700ms so swapping `emphasizedLines` at runtime
 * produces a smooth chapter-style focus change (imports → usage → result).
 *
 * `errorLines` (1-indexed): forces those lines to render in `errorColor`
 * regardless of Shiki's theme. Use for TypeScript diagnostic comments
 * (`// TS2322 ...`, squiggle lines) so the error reads as an error instead
 * of as a muted-gray comment.
 *
 * Shiki's `codeToHtml` is async; we wrap the load in Remotion's
 * `delayRender` / `continueRender` so frame capture waits for highlight
 * output. The HTML is trusted, server-generated content (not user input),
 * so injecting via `dangerouslySetInnerHTML` is the standard Remotion +
 * shiki pattern.
 */
export const HighlightedCode: React.FC<{
  code: string;
  lang: BundledLanguage | (string & {});
  theme?: BundledTheme | ThemeRegistrationAny | (string & {});
  emphasizedLines?: readonly number[];
  errorLines?: readonly number[];
  errorColor?: string;
}> = ({
  code,
  lang,
  theme = brandShikiTheme as unknown as ThemeRegistrationAny,
  emphasizedLines,
  errorLines,
  errorColor = "#EF4444",
}) => {
  const [html, setHtml] = useState<string | null>(null);
  const [handle] = useState(() => delayRender(`shiki: ${lang}`));

  useEffect(() => {
    let cancelled = false;
    codeToHtml(code, {
      lang: lang as BundledLanguage,
      theme: theme as BundledTheme | ThemeRegistrationAny,
      transformers: [
        {
          line(node, line) {
            const props = (node.properties ?? {}) as Record<string, unknown>;
            node.properties = {
              ...props,
              "data-line": String(line),
            };
          },
        },
      ],
    })
      .then((out) => {
        if (cancelled) return;
        if (typeof out !== "string" || out.trim() === "") {
          const preview = code.length > 60 ? code.slice(0, 60) + "..." : code;
          cancelRender(
            new Error(
              `HighlightedCode: shiki returned empty output for lang="${lang}". Code preview: ${preview}`,
            ),
          );
          return;
        }
        // Strip the theme's opaque background so the surrounding container
        // owns the look (brand-tinted overlay, blur, border, etc.). Shiki
        // bakes `background-color:#…;` directly into the root <pre style="…">
        // and sometimes the inner <code style="…">, so match both.
        const transparent = out.replace(
          /background-color:[^;"']+;?/g,
          "background-color:transparent;",
        );
        setHtml(transparent);
        continueRender(handle);
      })
      .catch((err) => {
        if (cancelled) return;
        cancelRender(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang, theme, handle]);

  const emphasisStyle = useMemo(() => {
    const parts: string[] = [];
    if (emphasizedLines && emphasizedLines.length > 0) {
      const selectors = emphasizedLines
        .map((n) => `.remotion-code-block [data-line="${n}"]`)
        .join(", ");
      parts.push(`
        .remotion-code-block [data-line] {
          transition: opacity 700ms ease, filter 700ms ease;
          opacity: 0.22;
          filter: blur(0.5px);
        }
        ${selectors} {
          opacity: 1;
          filter: none;
        }
      `);
    }
    if (errorLines && errorLines.length > 0) {
      const errorSelectors = errorLines
        .flatMap((n) => [
          `.remotion-code-block [data-line="${n}"]`,
          `.remotion-code-block [data-line="${n}"] span`,
        ])
        .join(", ");
      parts.push(`
        ${errorSelectors} {
          color: ${errorColor} !important;
        }
      `);
    }
    return parts.join("\n");
  }, [emphasizedLines, errorLines, errorColor]);

  if (html === null) {
    return null;
  }

  return (
    <div className="remotion-code-block">
      {emphasisStyle && <style>{emphasisStyle}</style>}
      {/* eslint-disable-next-line react/no-danger -- shiki output is trusted, server-generated */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default HighlightedCode;
