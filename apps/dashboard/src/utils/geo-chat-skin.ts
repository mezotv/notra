import type { GeoChatSkin } from "@/types/geo";
import { resolveEngineIconKey } from "@/utils/geo-engine-icon";

export function geoChatSkin(engine: string): GeoChatSkin {
  const key = resolveEngineIconKey(engine);
  if (key === "claude") {
    return "claude";
  }
  if (key === "gemini") {
    return "gemini";
  }
  if (key === "perplexity") {
    return "perplexity";
  }
  return "chatgpt";
}
