import { formatSnakeCaseLabel } from "@/utils/format";

export function getOutputTypeLabel(outputType: string): string {
  return formatSnakeCaseLabel(outputType);
}

export function getWebhookEventLabel(eventType: string): string {
  switch (eventType) {
    case "release":
      return "Release published";
    case "push":
      return "Push to default branch";
    case "ping":
      return "Webhook ping";
    default:
      return formatSnakeCaseLabel(eventType);
  }
}
