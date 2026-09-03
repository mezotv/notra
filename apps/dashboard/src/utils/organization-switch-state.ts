import type { OrganizationSwitchState } from "../types/dashboard";

export function markOrganizationSwitchStateActivated(
  state: OrganizationSwitchState | null,
  switchId: number
): OrganizationSwitchState | null {
  if (state?.id !== switchId) {
    return state;
  }
  return {
    ...state,
    phase: "restoring-project",
    recoveryReason: null,
  };
}

export function unblockOrganizationSwitchState(
  state: OrganizationSwitchState | null,
  switchId: number,
  reason?: OrganizationSwitchState["recoveryReason"]
): OrganizationSwitchState | null {
  if (state?.id !== switchId || !state.isUiBlocked) {
    return state;
  }
  return {
    ...state,
    isUiBlocked: false,
    recoveryReason:
      reason ??
      (state.phase === "activating"
        ? "activation-timeout"
        : "project-restoration-timeout"),
  };
}
