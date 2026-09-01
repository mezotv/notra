"use client";

import { SectionTicks } from "@notra/ui/components/ui/section-ticks";
import { SidebarProvider } from "@notra/ui/components/ui/sidebar";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { DesignSystemNav } from "@/components/design-system/design-system-nav";
import { DESIGN_SYSTEM_CATALOG } from "@/constants/design-system-catalog";

export function DesignSystemFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <SectionTicks items={DESIGN_SYSTEM_CATALOG} />
      <main className="container mx-auto flex flex-col gap-12 py-10 pr-6 pl-8 md:pl-20">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <DesignSystemNav />
            </div>
            <SidebarProvider className="min-h-0! w-auto" defaultOpen={false}>
              <ThemeToggle />
            </SidebarProvider>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm">
            {description}
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}
