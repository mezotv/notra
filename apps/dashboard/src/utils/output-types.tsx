import {
  Blockchain04Icon,
  ChartHistogramIcon,
  News01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Linkedin } from "@notra/ui/components/ui/svgs/linkedin";
import { XTwitter } from "@notra/ui/components/ui/svgs/twitter";
import type { JSX } from "react";

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  changelog: "Changelog",
  blog_post: "Blog Post",
  twitter_post: "Twitter Post",
  linkedin_post: "LinkedIn Post",
  investor_update: "Investor Update",
};

export function getOutputTypeLabel(outputType: string): string {
  return OUTPUT_TYPE_LABELS[outputType] ?? outputType.replaceAll("_", " ");
}

export function OutputTypeIcon({
  outputType,
  className = "size-4",
}: {
  outputType: string;
  className?: string;
}): JSX.Element | null {
  switch (outputType) {
    case "twitter_post":
      return <XTwitter className={className} />;
    case "linkedin_post":
      return <Linkedin className={className} />;
    case "changelog":
      return <HugeiconsIcon className={className} icon={Blockchain04Icon} />;
    case "blog_post":
      return <HugeiconsIcon className={className} icon={News01Icon} />;
    case "investor_update":
      return <HugeiconsIcon className={className} icon={ChartHistogramIcon} />;
    default:
      return null;
  }
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
      return eventType.replaceAll("_", " ");
  }
}
