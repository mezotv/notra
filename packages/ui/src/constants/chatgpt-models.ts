import type {
  ChatgptEffortId,
  ChatgptEffortOption,
  ChatgptModelId,
  ChatgptModelOption,
} from "../types/chatgpt";

export const CHATGPT_DEFAULT_MODEL: ChatgptModelId = "sol";
export const CHATGPT_DEFAULT_EFFORT: ChatgptEffortId = "medium";

export const CHATGPT_SOL_MODEL: ChatgptModelOption = {
  id: "sol",
  label: "GPT-5.6 Sol",
};

export const CHATGPT_MEDIUM_EFFORT: ChatgptEffortOption = {
  id: "medium",
  label: "Medium",
};

export const CHATGPT_MODELS: readonly ChatgptModelOption[] = [
  CHATGPT_SOL_MODEL,
  { id: "terra", label: "GPT-5.6 Terra" },
  { id: "luna", label: "GPT-5.6 Luna" },
  { id: "gpt-5.5", label: "GPT-5.5" },
  { id: "gpt-5.4", label: "GPT-5.4" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
];

export const CHATGPT_EFFORTS: readonly ChatgptEffortOption[] = [
  { id: "instant", label: "Instant" },
  CHATGPT_MEDIUM_EFFORT,
  { id: "high", label: "High" },
  { id: "extra-high", label: "Extra High" },
];
