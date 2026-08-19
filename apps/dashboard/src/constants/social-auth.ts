export const SOCIAL_AUTH_PROVIDERS: Record<string, string> = {
  github: "GitHubOAuth",
  google: "GoogleOAuth",
};

export const SOCIAL_AUTH_CALLBACK_PATH = "/auth/social/callback";
export const SOCIAL_AUTH_STATE_COOKIE = "notra_oauth_state";
export const SOCIAL_AUTH_STATE_MAX_AGE_SECONDS = 600;
