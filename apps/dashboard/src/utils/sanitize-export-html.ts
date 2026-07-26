import {
  EXPORT_HTML_FORBIDDEN_SELECTOR,
  EXPORT_HTML_SAFE_URL_SCHEMES,
  EXPORT_HTML_URL_ATTRIBUTES,
} from "@/constants/image-export";

const DATA_URL_PREFIX = "data:";
const SAFE_DATA_URL_PREFIX = "data:image/";
const SVG_DATA_URL_PREFIX = "data:image/svg";

function isSafeUrlValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") {
    return true;
  }

  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, window.location.origin);
  } catch {
    return false;
  }

  if (
    !(EXPORT_HTML_SAFE_URL_SCHEMES as readonly string[]).includes(
      parsed.protocol
    )
  ) {
    return false;
  }

  if (trimmed.toLowerCase().startsWith(DATA_URL_PREFIX)) {
    const lowered = trimmed.toLowerCase();
    return (
      lowered.startsWith(SAFE_DATA_URL_PREFIX) &&
      !lowered.startsWith(SVG_DATA_URL_PREFIX)
    );
  }

  return true;
}

function stripUnsafeAttributes(element: Element) {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();

    if (name.startsWith("on")) {
      element.removeAttribute(attribute.name);
      continue;
    }

    if (
      (EXPORT_HTML_URL_ATTRIBUTES as readonly string[]).includes(name) &&
      !isSafeUrlValue(attribute.value)
    ) {
      element.removeAttribute(attribute.name);
    }
  }
}

export function sanitizeExportHtml(html: string): DocumentFragment {
  const parsed = new DOMParser().parseFromString(html, "text/html");

  for (const element of parsed.querySelectorAll(
    EXPORT_HTML_FORBIDDEN_SELECTOR
  )) {
    element.remove();
  }

  for (const element of parsed.querySelectorAll("*")) {
    stripUnsafeAttributes(element);
  }

  const fragment = document.createDocumentFragment();
  for (const node of [...parsed.head.childNodes, ...parsed.body.childNodes]) {
    fragment.append(document.importNode(node, true));
  }

  return fragment;
}
