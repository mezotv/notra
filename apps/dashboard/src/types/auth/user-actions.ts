export interface UpdateUserInput {
  name?: string;
  image?: string | null;
  hidePersonalData?: boolean;
  showAgentStats?: boolean;
}

export interface UnlinkAccountInput {
  providerId: string;
}

export interface SignOutActionOptions {
  returnTo?: string;
}
