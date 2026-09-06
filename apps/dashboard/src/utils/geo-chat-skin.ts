import type { GeoChatSkin } from "@notra/geo-core/types/geo";
import { resolveEngineIconKey } from "@notra/geo-core/utils/geo-engine-icon";

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
  if (key === "opencode") {
    return "opencode";
  }
  return "chatgpt";
}
