export function buildOnboardingAgentMessage(
  domain: string,
  organizationId?: string
): string {
  const lines = [
    `Research the company at the domain ${domain} and produce the onboarding profile.`,
  ];
  if (organizationId) {
    lines.push(`The organizationId is ${organizationId}.`);
  } else {
    lines.push(
      "No organizationId is available for this run. Skip memory and skill editing; do research only."
    );
  }
  return lines.join(" ");
}
