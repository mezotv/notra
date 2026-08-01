import type { IrisReadinessItem } from "@/types/iris";

interface IrisReadinessInput {
  organizationSlug: string;
  slackReady: boolean;
  githubConnected: boolean;
}

export function buildIrisReadiness({
  organizationSlug,
  slackReady,
  githubConnected,
}: IrisReadinessInput): IrisReadinessItem[] {
  return [
    {
      key: "github",
      label: "Sources connected",
      description: githubConnected
        ? "Iris can see what your team ships."
        : "Connect a repository so Iris knows what you shipped.",
      ready: githubConnected,
      href: `/${organizationSlug}/integrations/github`,
      actionLabel: githubConnected ? "Manage" : "Connect",
    },
    {
      key: "slack",
      label: "Slack channel connected",
      description: slackReady
        ? "Iris reports to your Slack notification channel."
        : "Connect a Slack notification channel so Iris can report to you.",
      ready: slackReady,
      href: `/${organizationSlug}/integrations/slack`,
      actionLabel: slackReady ? "Manage" : "Connect",
    },
  ];
}
