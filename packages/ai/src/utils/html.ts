export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeMarkdownAlt(value: string) {
  return value.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}
