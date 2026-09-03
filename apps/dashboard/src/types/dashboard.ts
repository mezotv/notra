import type { ReactNode } from "react";

export interface OrgSelectOption {
  id: string;
  name: string;
  logo?: string | null;
}

export interface OrganizationOptionsListProps {
  organizations: OrgSelectOption[];
  selectedOrganizationId?: string | null;
  onSelect: (organizationId: string) => void;
  onCreate?: () => void;
  disabled?: boolean;
}

export interface OrganizationSwitchContextValue {
  isOrganizationSwitching: boolean;
  isOrganizationSwitchUiBlocked: boolean;
  organizationStateGeneration: number;
  settledOrganizationId: string | null;
  settledOrganizationSlug: string | null;
  settledOrganizationSwitchOutcome: OrganizationSwitchOutcome | null;
  organizationSwitchId: number | null;
  organizationSwitchPhase: OrganizationSwitchPhase | null;
  organizationSwitchRecoveryReason: OrganizationSwitchRecoveryReason | null;
  organizationSwitchTargetSlug: string | null;
  activateOrganization: (
    targetSlug: string,
    targetOrganizationId: string
  ) => Promise<OrganizationActivationResult>;
  startOrganizationSwitch: (
    targetSlug: string,
    targetOrganizationId: string
  ) => number;
  markOrganizationSwitchActivated: (switchId: number) => void;
  unblockOrganizationSwitch: (
    switchId: number,
    reason?: OrganizationSwitchRecoveryReason
  ) => void;
  finishOrganizationSwitch: (
    switchId: number,
    outcome: OrganizationSwitchOutcome
  ) => void;
  cancelOrganizationSwitch: (switchId: number) => void;
  isOrganizationSwitchCurrent: (switchId: number) => boolean;
  getOrganizationSwitchTargetSlug: () => string | null;
  markOrganizationPathSettled: (
    slug: string | null,
    organizationId: string | null
  ) => void;
  isOrganizationStateSettled: (
    pathname: string,
    organizationId: string | null
  ) => boolean;
}

export interface OrganizationSwitchProviderProps {
  children: ReactNode;
}

export interface OrganizationSwitchState {
  id: number;
  isUiBlocked: boolean;
  phase: OrganizationSwitchPhase;
  recoveryReason: OrganizationSwitchRecoveryReason | null;
  targetOrganizationId: string;
  targetSlug: string;
}

export type OrganizationSwitchPhase = "activating" | "restoring-project";

export type OrganizationSwitchRecoveryReason =
  | "activation-confirmation-failed"
  | "activation-timeout"
  | "project-url-update-failed"
  | "project-restoration-timeout";

export type OrganizationSwitchOutcome =
  | "project-ready"
  | "no-projects"
  | "project-load-error";

export interface OrganizationActivationResult {
  message: string | null;
  status: "activated" | "failed" | "confirmation-failed" | "stale";
  switchId: number;
}

export interface ContentPublishingMetricsData {
  drafts: number;
  published: number;
  graph: {
    activity: Array<{
      date: string;
      count: number;
      level: number;
      drafts: number;
      published: number;
    }>;
  };
}
