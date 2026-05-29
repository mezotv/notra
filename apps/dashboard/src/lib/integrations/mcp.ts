import type { AddMcpServerFormValues } from "@/schemas/integrations";

export const MCP_ACCENT_COLOR = "#9333EA";

export function getMcpFormErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Invalid value";
}

export function buildMcpHeaders(
  value: Pick<AddMcpServerFormValues, "headerName" | "headerValue">
) {
  const name = value.headerName.trim();
  const headerValue = value.headerValue.trim();

  return name && headerValue ? { [name]: headerValue } : {};
}
