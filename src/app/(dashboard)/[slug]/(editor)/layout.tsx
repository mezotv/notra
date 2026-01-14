import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

interface EditorLayoutProps {
  children: ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="bg-background p-2">
      <SidebarProvider
        className="h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-y-hidden"
        style={
          {
            "--sidebar-width": "400px",
          } as React.CSSProperties
        }
      >
        {children}
      </SidebarProvider>
    </div>
  );
}
