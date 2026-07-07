import { defineAgent } from "eve";
import { GPT_5_5_CONTEXT_WINDOW_TOKENS } from "./lib/constants/models";
import { onboardingProfileSchema } from "./lib/schemas/onboarding-profile";
import { createAgentModel } from "./lib/utils/model";

export default defineAgent({
  model: createAgentModel("openai/gpt-5.5"),
  modelContextWindowTokens: GPT_5_5_CONTEXT_WINDOW_TOKENS,
  reasoning: "medium",
  outputSchema: onboardingProfileSchema,
});
