export interface InvitationResponseData {
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

export type InvitationResponse = Promise<InvitationResponseData | null>;
