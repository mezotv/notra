export interface SlackConnectInviteInput {
  channelId: string;
  email?: string;
  userId?: string;
  externalLimited?: boolean;
}

export interface SlackConnectInviteResult {
  inviteId: string;
  isLegacySharedChannel: boolean;
}

export interface CreateSlackConnectChannelInput {
  channelName: string;
  isPrivate?: boolean;
}

export type SlackInviteRecipient =
  | { emails: string[]; user_ids?: never }
  | { user_ids: string[]; emails?: never };

export interface SlackConnectChannel {
  channelId: string;
  channelName: string;
}

export interface CreateSlackConnectChannelInviteInput {
  channelName: string;
  email?: string;
  userId?: string;
  externalLimited?: boolean;
  isPrivate?: boolean;
}

export interface CreateSlackConnectChannelInviteResult
  extends SlackConnectChannel, SlackConnectInviteResult {}
