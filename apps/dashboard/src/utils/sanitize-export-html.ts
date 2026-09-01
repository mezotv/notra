import DOMPurify from "dompurify";

import {
  EXPORT_HTML_DATA_URI_TAGS,
  EXPORT_HTML_DATA_URL_PREFIX,
  EXPORT_HTML_FORBIDDEN_ATTRIBUTES,
  EXPORT_HTML_FORBIDDEN_TAGS,
  EXPORT_HTML_IMAGE_URL_ATTRIBUTES,
  EXPORT_HTML_SAFE_DATA_URL_REGEX,
} from "@/constants/image-export";

function isDisallowedDataUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith(EXPORT_HTML_DATA_URL_PREFIX) &&
    !EXPORT_HTML_SAFE_DATA_URL_REGEX.test(trimmed)
  );
}

export function sanitizeExportHtml(html: string): DocumentFragment {
  const fragment = DOMPurify.sanitize(html, {
    ADD_DATA_URI_TAGS: EXPORT_HTML_DATA_URI_TAGS,
    FORBID_ATTR: EXPORT_HTML_FORBIDDEN_ATTRIBUTES,
    FORBID_TAGS: EXPORT_HTML_FORBIDDEN_TAGS,
    RETURN_DOM_FRAGMENT: true,
    WHOLE_DOCUMENT: true,
  });

  for (const element of fragment.querySelectorAll(
    EXPORT_HTML_DATA_URI_TAGS.join(", ")
  )) {
    for (const attribute of EXPORT_HTML_IMAGE_URL_ATTRIBUTES) {
      const value = element.getAttribute(attribute);
      if (value && isDisallowedDataUrl(value)) {
        element.removeAttribute(attribute);
      }
    }
  }

  return fragment;
}
