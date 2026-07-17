export type AuthMethod = "email" | "google" | "github";

export type SocialProvider = "google" | "github";

export interface SocialAuthButtonsProps {
  authMethod: AuthMethod | null;
  disabled: boolean;
  onSelect: (provider: SocialProvider) => void;
}

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface ImpersonationUser extends ConsoleUser {
  role?: string;
  banned: boolean | null;
}

export interface ImpersonationTarget {
  id: string;
  role: string | null;
  banned: boolean | null;
}

export interface AssertImpersonationTargetAllowedParams {
  actorUserId: string;
  target: ImpersonationTarget;
}

export interface GetServerSessionParams {
  headers: Headers;
}

export interface UserImpersonationDialogProps {
  currentUserId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export interface ImpersonationBannerProps {
  email: string;
  name: string;
}

export interface UserMenuProps {
  isAdmin: boolean;
  user: ConsoleUser;
}
