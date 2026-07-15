export type AuthMethod = "email" | "google" | "github";

export type SocialProvider = "google" | "github";

export interface SocialAuthButtonsProps {
  authMethod: AuthMethod | null;
  disabled: boolean;
  onSelect: (provider: SocialProvider) => void;
}
