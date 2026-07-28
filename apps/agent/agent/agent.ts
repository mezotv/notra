import { defineAgent } from "eve";
import {
  ASSISTANT_MODEL_ID,
  SONNET_4_6_CONTEXT_WINDOW_TOKENS,
} from "./lib/constants/models";
import { createAgentModel } from "./lib/utils/model";

export default defineAgent({
  build: {
    externalDependencies: [
      "@ai-sdk/devtools",
      "@ai-sdk/gateway",
      "@aws-sdk/client-s3",
      "@vercel/oidc",
      "@linear/sdk",
      "@octokit/core",
      "@resvg/resvg-js",
      "@upstash/box",
      "@upstash/redis",
      "marked",
      "pg",
      "sanitize-html",
      "satori",
      "satori-html",
    ],
  },
  model: createAgentModel(ASSISTANT_MODEL_ID),
  modelContextWindowTokens: SONNET_4_6_CONTEXT_WINDOW_TOKENS,
});
