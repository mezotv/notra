import type { users } from "@notra/db/schema";
import type { PendingVerification } from "@notra/ui/lib/auth-types";
import type { CSSProperties } from "react";

export type SessionUser = typeof users.$inferSelect;

export interface SessionInfo {
  userId: string;
  activeOrganizationId: string | null;
  impersonatedBy: string | null;
}

export interface AuthSessionData {
  session: SessionInfo;
  user: SessionUser;
}

export interface ClientSessionData {
  session: SessionInfo;
  user: Pick<
    SessionUser,
    | "id"
    | "name"
    | "email"
    | "emailVerified"
    | "image"
    | "role"
    | "hidePersonalData"
    | "showAgentStats"
    | "createdAt"
  >;
}

export interface SignOutOptions {
  fetchOptions?: {
    onSuccess?: () => void;
  };
}

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface ImpersonationUser extends ConsoleUser {
  role: string | null;
  banned: boolean | null;
}

export interface BannedStatusUser {
  banned: boolean | null;
  banExpires: Date | null;
}

export interface ListUsersInput {
  search?: string;
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

export interface ImpersonationBannerStyle extends CSSProperties {
  "--impersonation-banner-height": string;
}

export interface UserMenuProps {
  isAdmin: boolean;
  user: ConsoleUser;
}

export interface SocialCallbackOutcome {
  kind: "success" | "failed" | "verification-required";
  pendingAuthenticationToken?: string;
  email?: string;
}

export interface ConsoleLoginFormProps {
  returnTo?: string;
  initialError?: string;
  initialPendingVerification?: PendingVerification;
}
