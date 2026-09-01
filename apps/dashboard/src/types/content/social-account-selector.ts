import type { CSSProperties, ReactNode } from "react";

import type { ConnectedAccount } from "@/types/hooks/connected-accounts";

export interface SocialPostAccountSelector {
  accounts: ConnectedAccount[];
  onSelect: (accountId: string) => void;
}

export interface SocialAccountSelectorProps extends SocialPostAccountSelector {
  trigger: ReactNode;
  className?: string;
  style?: CSSProperties;
}
