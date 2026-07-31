export interface LinkedTwitterAccount {
  id: string;
  providerAccountId: string;
  username: string;
  displayName: string | null;
}

export interface PublishTwitterPostParams {
  organizationId: string;
  accountId: string;
  content: string;
}

export interface PublishTwitterPostResult {
  postUrl: string | null;
  username: string;
  confirmed: boolean;
}
