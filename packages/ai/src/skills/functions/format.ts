import { WHITESPACE_REGEX } from "../constants";

export function normalizeInlineText(value: string) {
  return value.replace(WHITESPACE_REGEX, " ").trim();
}

export function escapeXmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeXmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
