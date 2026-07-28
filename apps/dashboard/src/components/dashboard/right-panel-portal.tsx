"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { RIGHT_PANEL_PORTAL_ID } from "@/constants/right-panel";
import type { RightPanelPortalProps } from "@/types/components/right-panel-portal";

const subscribeToPortalTarget = () => () => {
  // the portal outlet is rendered by the dashboard shell and never swapped
};

const getPortalTarget = () =>
  document.getElementById(RIGHT_PANEL_PORTAL_ID) ?? null;

const getServerPortalTarget = () => null;

export function RightPanelPortal({ children }: RightPanelPortalProps) {
  const target = useSyncExternalStore(
    subscribeToPortalTarget,
    getPortalTarget,
    getServerPortalTarget
  );

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}
