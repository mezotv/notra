export type GeminiModelId = "flash-lite" | "flash" | "pro" | "thinking";

export type GeminiModelGroup = "core" | "thinking";

export interface GeminiModelOption {
  id: GeminiModelId;
  label: string;
  chip: string;
  description: string;
  group: GeminiModelGroup;
  badge?: string;
}
