import type { GeoChatSkin } from "@notra/ui/types/geo";

const CLAUDE_MARKDOWN_FONT =
  "font-serif [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_p]:font-serif [&_li]:font-serif";

const SANS_MARKDOWN_FONT =
  "font-sans [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_p]:font-sans [&_li]:font-sans";

export function geoAnswerMarkdownFontClass(skin: GeoChatSkin): string {
  return skin === "claude" ? CLAUDE_MARKDOWN_FONT : SANS_MARKDOWN_FONT;
}

export function geoAnswerEmptyClassName(skin: GeoChatSkin): string {
  if (skin === "claude") {
    return "font-serif text-[17px] leading-[1.7]";
  }
  if (skin === "perplexity") {
    return "font-sans text-[17.5px] leading-[1.75]";
  }
  return "text-[15px] leading-7";
}

export function geoAnswerThinkingClassName(skin: GeoChatSkin): string {
  if (skin === "claude") {
    return "font-serif text-[17px]";
  }
  if (skin === "perplexity") {
    return "font-sans text-[17.5px]";
  }
  return "text-[15px]";
}
