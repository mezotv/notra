export type ChatgptModelId =
  | "sol"
  | "terra"
  | "luna"
  | "gpt-5.5"
  | "gpt-5.4"
  | "gpt-5.4-mini";

export type ChatgptEffortId = "instant" | "medium" | "high" | "extra-high";

export interface ChatgptModelOption {
  id: ChatgptModelId;
  label: string;
}

export interface ChatgptEffortOption {
  id: ChatgptEffortId;
  label: string;
}
