"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RIGHT_PANEL_PORTAL_ID } from "@/constants/right-panel";
import type { RightPanelPortalProps } from "@/types/components/right-panel-portal";

export function RightPanelPortal({ children }: RightPanelPortalProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById(RIGHT_PANEL_PORTAL_ID));
  }, []);

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}
