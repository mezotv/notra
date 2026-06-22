export interface InvitationData {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  inviterEmail: string;
  inviterName: string;
  inviterId: string;
  email: string;
  role: string | null;
  status: "pending" | "accepted" | "rejected" | "canceled";
  expiresAt: Date;
  expired: boolean;
}

export interface InvitationUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
}

export interface InvitationPageClientProps {
  invitationId: string;
  invitation: InvitationData;
  user: InvitationUser | null;
  initialError?: string | null;
}

export type InviteStatus = "pending" | "accepted" | "rejected";

export interface InvitationState {
  user: InvitationUser | null;
  inviteStatus: InviteStatus;
  error: string | null;
  accepting: boolean;
  rejecting: boolean;
}

export type InvitationAction =
  | { type: "userSynced"; user: InvitationUser | null }
  | { type: "errorChanged"; error: string | null }
  | { type: "acceptStarted" }
  | { type: "acceptFinished" }
  | { type: "rejectStarted" }
  | { type: "rejectFinished" }
  | { type: "inviteStatusChanged"; inviteStatus: InviteStatus };
