"use client";

import { useMemo } from "react";
import { AiChatSidebar } from "@/components/content/ai-chat-sidebar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type EditorSidebarTab = "logs" | "chat";

interface EditorSidebarProps {
  activeTab: EditorSidebarTab;
  contentTitle: string;
  onTabChange: (tab: EditorSidebarTab) => void;
  onSidebarInteract?: () => void;
}

export function EditorSidebar({
  activeTab,
  contentTitle,
  onTabChange,
  onSidebarInteract,
}: EditorSidebarProps) {
  const tabValue = useMemo(
    () => (activeTab === "logs" ? "logs" : "chat"),
    [activeTab]
  );

  return (
    <Sidebar
      className={cn(
        "m-2 h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] overflow-hidden rounded-xl border border-sidebar-border bg-sidebar",
        "select-none"
      )}
      collapsible="none"
      onMouseDownCapture={onSidebarInteract}
      side="right"
    >
      <SidebarHeader className="sticky top-0 z-10 shrink-0 bg-sidebar px-6 py-4">
        <Tabs
          className="w-full"
          onValueChange={(value) => onTabChange(value as EditorSidebarTab)}
          value={tabValue}
        >
          <TabsList
            className="grid w-full bg-sidebar-accent/70"
            style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
          >
            <TabsTrigger className="px-2" value="logs">
              Logs
            </TabsTrigger>
            <TabsTrigger className="px-2" value="chat">
              AI Chat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 overflow-hidden bg-sidebar text-sidebar-foreground">
        <Tabs
          className="flex h-full flex-col"
          onValueChange={(value) => onTabChange(value as EditorSidebarTab)}
          value={tabValue}
        >
          <TabsContent
            className="min-h-0 flex-1 data-[state=inactive]:hidden"
            value="logs"
          >
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-4 text-center">
              <div className="text-sidebar-foreground/70 text-sm">
                Logs will appear here.
              </div>
              <Button size="sm" variant="outline">
                Refresh logs
              </Button>
            </div>
          </TabsContent>
          <TabsContent
            className="min-h-0 flex-1 data-[state=inactive]:hidden"
            value="chat"
          >
            <div className="h-full px-6 py-4">
              <AiChatSidebar contentTitle={contentTitle} variant="sidebar" />
            </div>
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  );
}
