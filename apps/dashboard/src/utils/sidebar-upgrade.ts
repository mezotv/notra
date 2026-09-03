import type {
  SidebarUpgradeCopy,
  SidebarUpgradeCopyInput,
} from "@/types/components/sidebar-upgrade";

export function getSidebarUpgradeCopy({
  hasNoPlan,
  loading,
  showTrial,
  targetGroupName,
}: SidebarUpgradeCopyInput): SidebarUpgradeCopy {
  const heading = hasNoPlan ? "Get Started" : `Upgrade to ${targetGroupName}`;
  let description = "Get more AI answers, projects, and higher usage limits.";
  if (hasNoPlan) {
    description = showTrial
      ? "Start your free trial and unlock AI-powered workflows."
      : "Pick a plan to unlock AI-powered workflows.";
  }

  let buttonLabel = hasNoPlan ? "Get started" : `Upgrade to ${targetGroupName}`;
  if (showTrial) {
    buttonLabel = "Start free trial";
  }
  if (loading) {
    buttonLabel = "Loading...";
  }
  return { buttonLabel, description, heading };
}
