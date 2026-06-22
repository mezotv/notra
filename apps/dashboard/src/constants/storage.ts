const CHAT_PREFERENCES_STORAGE_VERSION = "v1";

export const localStorageKeys = {
  chatPreferences: `notra_chat_preferences:${CHAT_PREFERENCES_STORAGE_VERSION}`,
  chatQueue: (chatId: string) => `chat-queue:${chatId}`,
  imageExportTarget: "notra:image-export-target",
  contentView: "notra:content-view",
  sidebarOnboardingCollapsed: (organizationId?: string) =>
    organizationId
      ? `onboarding-collapsed:${organizationId}`
      : "onboarding-collapsed",
  brandIdentity: (organizationId: string) =>
    `notra:brand-identity:v1:${organizationId}`,
} as const;

export const sessionStorageKeys = {
  marketingAttribution: "notra_marketing_signup_attribution",
  toastDedupe: "notra:deduped-toasts",
} as const;
