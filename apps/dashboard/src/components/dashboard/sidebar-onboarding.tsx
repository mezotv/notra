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
import { useCustomer } from "autumn-js/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { localStorageKeys } from "@/constants/storage";
import { useOnboardingStatus } from "@/lib/hooks/use-onboarding";

const MORPH_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;

export function SidebarOnboarding() {
  const { activeOrganization } = useOrganizationsContext();
  const orgId = activeOrganization?.id ?? "";
  const slug = activeOrganization?.slug ?? "";

  const { data } = useOnboardingStatus(orgId);
  const { data: customer } = useCustomer({
    expand: ["subscriptions.plan"],
  });
  const [collapsed, setCollapsed] = useState(false);

  const storageKey = localStorageKeys.sidebarOnboardingCollapsed(orgId);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      setCollapsed(stored === "true");
      return;
    }
    if (!data) {
      return;
    }
    const hasCompletedStep =
      data.hasBrandIdentity || data.hasIntegration || data.hasSchedule;
    setCollapsed(hasCompletedStep);
  }, [storageKey, data]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }, [storageKey]);

  const hasActiveSubscription = customer?.subscriptions.some(
    (subscription) => !subscription.addOn && subscription.status === "active"
  );

  if (!data || data.onboardingCompleted || data.onboardingDismissed) {
    return null;
  }

  if (customer && !hasActiveSubscription) {
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
      href: `/${slug}/automation/schedules`,
      completed: data.hasSchedule,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <SidebarGroup className="px-3 pb-2 group-data-[collapsible=icon]:hidden">
      <motion.div
        layout
        style={{ transformOrigin: "top" }}
        transition={MORPH_TRANSITION}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {collapsed ? (
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="collapsed"
              transition={MORPH_TRANSITION}
            >
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-xs transition-colors hover:bg-muted"
                onClick={toggleCollapsed}
                type="button"
              >
                <motion.span
                  className="flex-1 truncate font-medium"
                  layoutId="onboarding-title"
                  transition={MORPH_TRANSITION}
                >
                  Getting Started ({completedCount}/{steps.length})
                </motion.span>
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
              <motion.div
                className="mt-1"
                layoutId="onboarding-progress"
                transition={MORPH_TRANSITION}
              >
                <Progress className="h-1" value={progress} />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="expanded"
              transition={MORPH_TRANSITION}
            >
              <OnboardingChecklist
                className="bg-sidebar-accent/40 py-2 ring-0"
                onClose={toggleCollapsed}
              >
                <OnboardingChecklistHeader>
                  <motion.div
                    layoutId="onboarding-title"
                    transition={MORPH_TRANSITION}
                  >
                    <OnboardingChecklistTitle>
                      Getting Started
                    </OnboardingChecklistTitle>
                  </motion.div>
                </OnboardingChecklistHeader>
                <OnboardingChecklistContent title="Complete these steps to get the most out of Notra.">
                  <motion.div
                    layoutId="onboarding-progress"
                    transition={MORPH_TRANSITION}
                  >
                    <OnboardingChecklistProgress value={progress} />
                  </motion.div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </SidebarGroup>
  );
}
