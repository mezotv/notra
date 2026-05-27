export const GITHUB_API_VERSION = "2022-11-28";

export const DEFAULT_REPOSITORY_OUTPUT_CONFIG = [
  { outputType: "changelog", enabled: true },
  { outputType: "blog_post", enabled: false },
  { outputType: "twitter_post", enabled: false },
  { outputType: "linkedin_post", enabled: false },
  { outputType: "investor_update", enabled: false },
] as const;
