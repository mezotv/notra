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
import { AnimatePresence, domMax, LazyMotion } from "motion/react";
import { div as MotionDiv, span as MotionSpan } from "motion/react-m";
import { useSyncExternalStore } from "react";
import { BrailleLoader } from "@/components/braille-loader";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { AGENT_RUN_REFETCH_INTERVAL_MS } from "@/constants/onboarding-agent";
import { localStorageKeys } from "@/constants/storage";
import {
  useOnboardingAgentRun,
  useOnboardingStatus,
} from "@/lib/hooks/use-onboarding";

const MORPH_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;

const collapsedListeners = new Set<() => void>();

function subscribeToCollapsedStorage(callback: () => void) {
  collapsedListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    collapsedListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function setStoredCollapsed(storageKey: string, value: boolean) {
  localStorage.setItem(storageKey, String(value));
  for (const listener of collapsedListeners) {
    listener();
  }
}

export function SidebarOnboarding() {
  const { activeOrganization } = useOrganizationsContext();
  const orgId = activeOrganization?.id ?? "";
  const slug = activeOrganization?.slug ?? "";

  const { data: agentRun } = useOnboardingAgentRun(orgId);
  const agentRunning = agentRun?.running ?? false;
  const { data } = useOnboardingStatus(orgId, {
    refetchInterval: agentRunning ? AGENT_RUN_REFETCH_INTERVAL_MS : false,
  });
  const { data: customer } = useCustomer({
    expand: ["subscriptions.plan"],
  });

  const storageKey = localStorageKeys.sidebarOnboardingCollapsed(orgId);
  const storedCollapsed = useSyncExternalStore(
    subscribeToCollapsedStorage,
    () => localStorage.getItem(storageKey),
    () => null
  );
  const hasCompletedStep =
    data?.hasBrandIdentity || data?.hasIntegration || data?.hasSchedule;
  const collapsed =
    storedCollapsed === null ? !!hasCompletedStep : storedCollapsed === "true";

  const toggleCollapsed = () => {
    setStoredCollapsed(storageKey, !collapsed);
  };

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
      <LazyMotion features={domMax}>
        <MotionDiv
          layout
          style={{ transformOrigin: "bottom" }}
          transition={MORPH_TRANSITION}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {collapsed ? (
              <MotionDiv
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key="collapsed"
                transition={MORPH_TRANSITION}
              >
                <button
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-xs transition-colors hover:bg-muted"
                  onClick={toggleCollapsed}
                  type="button"
                >
                  <MotionSpan
                    className="flex-1 truncate font-medium"
                    layoutId="onboarding-title"
                    transition={MORPH_TRANSITION}
                  >
                    Getting Started ({completedCount}/{steps.length})
                  </MotionSpan>
                  {agentRunning && <BrailleLoader className="text-xs" />}
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
                <MotionDiv
                  className="mt-1"
                  layoutId="onboarding-progress"
                  transition={MORPH_TRANSITION}
                >
                  <Progress className="h-1" value={progress} />
                </MotionDiv>
              </MotionDiv>
            ) : (
              <MotionDiv
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
                    <MotionDiv
                      layoutId="onboarding-title"
                      transition={MORPH_TRANSITION}
                    >
                      <OnboardingChecklistTitle>
                        Getting Started
                      </OnboardingChecklistTitle>
                    </MotionDiv>
                  </OnboardingChecklistHeader>
                  <OnboardingChecklistContent title="Complete these steps to get the most out of Notra.">
                    <MotionDiv
                      layoutId="onboarding-progress"
                      transition={MORPH_TRANSITION}
                    >
                      <OnboardingChecklistProgress value={progress} />
                    </MotionDiv>
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
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>
      </LazyMotion>
    </SidebarGroup>
  );
}
