import {
  CHATGPT_EFFORTS,
  CHATGPT_MEDIUM_EFFORT,
  CHATGPT_MODELS,
  CHATGPT_SOL_MODEL,
} from "../constants/chatgpt-models";
import type {
  ChatgptEffortId,
  ChatgptEffortOption,
  ChatgptModelId,
  ChatgptModelOption,
} from "../types/chatgpt";

export function getChatgptModel(id: ChatgptModelId): ChatgptModelOption {
  return CHATGPT_MODELS.find((item) => item.id === id) ?? CHATGPT_SOL_MODEL;
}

export function getChatgptEffort(id: ChatgptEffortId): ChatgptEffortOption {
  return CHATGPT_EFFORTS.find((item) => item.id === id) ?? CHATGPT_MEDIUM_EFFORT;
}
