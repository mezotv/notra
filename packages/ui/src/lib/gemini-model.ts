import {
  GEMINI_MODELS,
  GEMINI_PRO_MODEL,
} from "../constants/gemini-models";
import type { GeminiModelId, GeminiModelOption } from "../types/gemini";

export function getGeminiModel(id: GeminiModelId): GeminiModelOption {
  return GEMINI_MODELS.find((item) => item.id === id) ?? GEMINI_PRO_MODEL;
}

export function getGeminiModelsByGroup(
  group: GeminiModelOption["group"]
): GeminiModelOption[] {
  return GEMINI_MODELS.filter((item) => item.group === group);
}
