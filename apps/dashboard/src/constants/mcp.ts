import type { AddMcpServerFormValues } from "@/schemas/integrations";

export const MCP_AUTH_OPTIONS = [
  { label: "None", value: "none" },
  { label: "API key", value: "headers" },
  { label: "OAuth", value: "oauth" },
] as const;

export const DEFAULT_MCP_SERVER_FORM_VALUES: AddMcpServerFormValues = {
  authType: "none",
  name: "",
  url: "",
  description: "",
  headers: [{ name: "", value: "" }],
};
