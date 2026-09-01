export const FEEDBACK_MD_CHECK_ID = "notra-feedback-md";
export const FEEDBACK_MD_CHECK_NAME = "feedback.md";
export const FEEDBACK_MD_PATH = "/feedback.md";
export const FEEDBACK_MD_CONTENT_TYPE = "text/markdown";
export const FEEDBACK_MD_MAX_RESPONSE_CHARS = 64 * 1024;
export const FEEDBACK_MD_MAX_REDIRECTS = 3;
export const FEEDBACK_MD_REQUEST_TIMEOUT_MS = 15 * 1000;

export const FEEDBACK_MD_SETUP_RECOMMENDATION =
  "Read https://usenotra.com/feedback-md and implement its template as a public /feedback.md file. Before writing it, ask for the URL or address where agent feedback should go. Include a “Where to send it” heading with at least one real MCP tool, HTTP endpoint, email address, or issue tracker. Serve the file with Content-Type: text/markdown. Then link it from /llms.txt, creating /llms.txt if it does not exist.";

export const FEEDBACK_MD_REQUIRED_SECTION_REGEX =
  /^#{1,6}\s+Where to send it\s*$/im;
export const FEEDBACK_MD_HTML_DOCUMENT_REGEX = /^\s*(?:<!doctype html|<html)/i;
