export interface Account {
  id: string;
  providerId: string;
  accountId: string;
  [key: string]: unknown;
}

export interface ProfileSectionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface ProfileSectionProps {
  user: ProfileSectionUser;
  onSessionRefetch?: () => void | Promise<void>;
}

export interface LoginDetailsSectionProps {
  email: string;
  hasPasswordAccount: boolean;
}

export interface ConnectedAccountsSectionProps {
  accounts: Account[];
  hasGoogleLinked: boolean;
  hasGithubLinked: boolean;
  isError: boolean;
  onAccountsChange: () => void;
}
