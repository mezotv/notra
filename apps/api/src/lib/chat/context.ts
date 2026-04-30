import type { StandaloneChatContextItem } from "@notra/ai/schemas/standalone-chat";
import type { ValidatedIntegration } from "@notra/ai/types/orchestration";

export function deriveContextFromValidatedIntegrations(
  validatedIntegrations: ValidatedIntegration[]
): StandaloneChatContextItem[] {
  const items: StandaloneChatContextItem[] = [];
  for (const integration of validatedIntegrations) {
    if (integration.type === "github") {
      for (const repository of integration.repositories) {
        if (
          repository.enabled &&
          typeof repository.owner === "string" &&
          repository.owner.length > 0 &&
          typeof repository.repo === "string" &&
          repository.repo.length > 0
        ) {
          items.push({
            type: "github-repo",
            integrationId: integration.id,
            owner: repository.owner,
            repo: repository.repo,
          });
        }
      }
    } else if (integration.type === "linear") {
      items.push({
        type: "linear-team",
        integrationId: integration.id,
        teamName: integration.linearTeamName ?? undefined,
      });
    }
  }
  return items;
}
