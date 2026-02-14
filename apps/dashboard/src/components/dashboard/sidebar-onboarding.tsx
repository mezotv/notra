"use client";

import {
  OnboardingChecklist,
  OnboardingChecklistContent,
  OnboardingChecklistHeader,
  OnboardingChecklistItem,
  OnboardingChecklistItems,
  OnboardingChecklistProgress,
  OnboardingChecklistTitle,
} from "@notra/ui/components/ui/onboarding-checklist";
import { Progress } from "@notra/ui/components/ui/progress";
import { SidebarGroup } from "@notra/ui/components/ui/sidebar";
import { useCallback, useEffect, useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useOnboardingStatus } from "@/lib/hooks/use-onboarding";

const STORAGE_KEY = "onboarding-collapsed";

export function SidebarOnboarding() {
  const { activeOrganization } = useOrganizationsContext();
  const orgId = activeOrganization?.id ?? "";
  const slug = activeOrganization?.slug ?? "";

  const { data } = useOnboardingStatus(orgId);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  if (!data || data.onboardingCompleted || data.onboardingDismissed) {
    return null;
  }

  const steps = [
    {
      label: "Set up brand identity",
      href: `/${slug}/brand/identity`,
      completed: data.hasBrandIdentity,
    },
    {
      label: "Add an integration",
      href: `/${slug}/integrations`,
      completed: data.hasIntegration,
    },
    {
      label: "Create a schedule",
      href: `/${slug}/automation/schedule`,
      completed: data.hasSchedule,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  if (collapsed) {
    return (
      <SidebarGroup className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-xs transition-colors hover:bg-muted"
          onClick={toggleCollapsed}
          type="button"
        >
          <span className="flex-1 truncate font-medium">
            Getting Started ({completedCount}/{steps.length})
          </span>
          <svg
            aria-hidden="true"
            className="size-3 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <title>Expand</title>
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <Progress className="mt-1 h-1" value={progress} />
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
      <OnboardingChecklist onClose={toggleCollapsed}>
        <OnboardingChecklistHeader>
          <OnboardingChecklistTitle>Getting Started</OnboardingChecklistTitle>
        </OnboardingChecklistHeader>
        <OnboardingChecklistContent title="Complete these steps to get the most out of Notra.">
          <OnboardingChecklistProgress value={progress} />
          <OnboardingChecklistItems>
            {steps.map((step) => (
              <OnboardingChecklistItem
                completed={step.completed}
                href={step.href}
                key={step.href}
              >
                {step.label}
              </OnboardingChecklistItem>
            ))}
          </OnboardingChecklistItems>
        </OnboardingChecklistContent>
      </OnboardingChecklist>
    </SidebarGroup>
  );
}
