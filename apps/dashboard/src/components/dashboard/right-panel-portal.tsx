"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RIGHT_PANEL_PORTAL_ID } from "@/constants/right-panel";
import type { RightPanelPortalProps } from "@/types/components/right-panel-portal";

function getPortalTarget() {
  if (typeof document === "undefined") {
    return null;
  }
  return document.getElementById(RIGHT_PANEL_PORTAL_ID);
}

export function RightPanelPortal({ children }: RightPanelPortalProps) {
  const [target, setTarget] = useState<HTMLElement | null>(getPortalTarget);

  useEffect(() => {
    if (!target) {
      setTarget(getPortalTarget());
    }
  }, [target]);

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}
