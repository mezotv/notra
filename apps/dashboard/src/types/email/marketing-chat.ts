export interface MarketingChatRecipient {
  email: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
}

export interface MarketingChatSendResult {
  email: string;
  organizationSlug: string;
  status: "sent" | "failed";
  id?: string;
  error?: string;
}
