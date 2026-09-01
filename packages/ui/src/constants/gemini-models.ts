import type { GeminiModelId, GeminiModelOption } from "../types/gemini";

export const GEMINI_DEFAULT_MODEL: GeminiModelId = "pro";

export const GEMINI_PRO_MODEL: GeminiModelOption = {
  id: "pro",
  label: "3.1 Pro",
  chip: "Pro",
  description: "Logisches Schlussfolgern",
  group: "core",
};

export const GEMINI_MODELS: readonly GeminiModelOption[] = [
  {
    id: "flash-lite",
    label: "3.5 Flash-Lite",
    chip: "Flash-Lite",
    description: "Schnellste Antworten",
    group: "core",
  },
  {
    id: "flash",
    label: "3.7 Flash",
    chip: "Flash",
    description: "Vielseitige Unterstützung",
    group: "core",
    badge: "Neu",
  },
  GEMINI_PRO_MODEL,
  {
    id: "thinking",
    label: "Thinking (erweitert)",
    chip: "Thinking",
    description: "Komplexe Problemlösungen",
    group: "thinking",
  },
];
