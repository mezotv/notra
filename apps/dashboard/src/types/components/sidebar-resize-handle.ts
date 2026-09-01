import type { Sidebar } from "@notra/ui/components/ui/sidebar";
import type { ComponentProps } from "react";

export interface SidebarResizeHandleProps {
  onWidthChange: (width: number) => void;
  onWidthChangeEnd: (width: number) => void;
  onWidthChangeStart: () => void;
  width: number;
}

export interface DashboardSidebarProps
  extends ComponentProps<typeof Sidebar>, SidebarResizeHandleProps {
  resizing: boolean;
}

export interface UseSidebarWidthResult {
  finishSidebarResize: (width: number) => void;
  setSidebarWidth: (width: number) => void;
  sidebarResizing: boolean;
  sidebarWidth: number;
  startSidebarResize: () => void;
}
