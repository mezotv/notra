import type { AuthMethod } from "@/types/auth/method";

export type SocialProvider = "google" | "github";

export interface AuthFormHeaderProps {
  title?: string;
  description?: string;
}

export interface AuthSocialButtonsProps {
  authMethod: AuthMethod | null;
  disabled: boolean;
  lastMethod?: string | null;
  onSelect: (provider: SocialProvider) => void;
}

export interface AuthEmailFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  placeholder: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}

export interface AuthPasswordFieldProps {
  id: string;
  value: string;
  error?: string;
  disabled: boolean;
  placeholder: string;
  autoComplete: string;
  onBlur: () => void;
  onChange: (value: string) => void;
}
