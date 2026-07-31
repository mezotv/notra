export interface ConnectedAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  verified: boolean;
  verifiedType: string | null;
  createdAt: string;
}
