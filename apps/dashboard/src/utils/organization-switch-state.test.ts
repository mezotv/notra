import { describe, expect, test } from "bun:test";

import type { OrganizationSwitchState } from "../types/dashboard";
import {
  markOrganizationSwitchStateActivated,
  unblockOrganizationSwitchState,
} from "./organization-switch-state";

const activatingSwitch: OrganizationSwitchState = {
  id: 2,
  isUiBlocked: true,
  phase: "activating",
  recoveryReason: null,
  targetOrganizationId: "organization-b",
  targetSlug: "b",
};

describe("organization switch state", () => {
  test("ignores a stale completion after a newer switch starts", () => {
    expect(markOrganizationSwitchStateActivated(activatingSwitch, 1)).toBe(
      activatingSwitch
    );
  });

  test("moves only the current switch into project restoration", () => {
    expect(markOrganizationSwitchStateActivated(activatingSwitch, 2)).toEqual({
      ...activatingSwitch,
      phase: "restoring-project",
      recoveryReason: null,
    });
  });

  test("recovery unblocks the UI without completing analytics state", () => {
    expect(unblockOrganizationSwitchState(activatingSwitch, 2)).toEqual({
      ...activatingSwitch,
      isUiBlocked: false,
      recoveryReason: "activation-timeout",
    });
  });

  test("distinguishes a project restoration timeout", () => {
    expect(
      unblockOrganizationSwitchState(
        { ...activatingSwitch, phase: "restoring-project" },
        2
      )
    ).toEqual({
      ...activatingSwitch,
      isUiBlocked: false,
      phase: "restoring-project",
      recoveryReason: "project-restoration-timeout",
    });
  });

  test("preserves an explicit recovery reason", () => {
    expect(
      unblockOrganizationSwitchState(
        { ...activatingSwitch, phase: "restoring-project" },
        2,
        "project-url-update-failed"
      )
    ).toEqual({
      ...activatingSwitch,
      isUiBlocked: false,
      phase: "restoring-project",
      recoveryReason: "project-url-update-failed",
    });
  });
});
