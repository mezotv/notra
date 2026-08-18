import type { AccountInfo } from "@/types/organizations/actions";

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
  accounts: AccountInfo[];
  hasGoogleLinked: boolean;
  hasGithubLinked: boolean;
  isError: boolean;
  onAccountsChange: () => void;
}
