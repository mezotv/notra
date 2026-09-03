export interface SidebarUpgradeCopyInput {
  hasNoPlan: boolean;
  loading: boolean;
  showTrial: boolean;
  targetGroupName: string | undefined;
}

export interface SidebarUpgradeCopy {
  buttonLabel: string;
  description: string;
  heading: string;
}

export interface SidebarUpgradeCardProps extends SidebarUpgradeCopy {
  loading: boolean;
  onUpgrade: () => void;
}
