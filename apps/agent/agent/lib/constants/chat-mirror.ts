import { ASSISTANT_MODEL_ID } from "./models";

export const MIRRORED_CHANNEL_KINDS = new Set(["channel:slack"]);

export const MIRROR_ASSISTANT_METADATA = {
  model: ASSISTANT_MODEL_ID,
  requestedModel: ASSISTANT_MODEL_ID,
} as const;

export const MIRROR_DELTA_THROTTLE_MS = 400;

export const MIRROR_DELTA_THROTTLE_MAX_ENTRIES = 200;

export const MIRROR_TOOL_OUTPUT_MAX_CHARS = 4000;

export const MIRROR_TOOL_NAME_OVERRIDES: Record<string, string> = {
  create_linkedin_post: "createLinkedInPost",
  search_web: "webSearch",
  web_search: "webSearch",
  web_fetch: "fetchWebpage",
};
