import {
  Calendar03Icon,
  Link04Icon,
  Notification03Icon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Slack } from "@notra/ui/components/ui/svgs/slack";
import type { IntegrationType } from "@/types/webhooks/webhooks";

export function IntegrationIcon({ type }: { type: IntegrationType }) {
  switch (type) {
    case "github":
      return <Github className="size-4" />;
    case "linear":
      return <Linear className="size-4" />;
    case "slack":
      return <Slack className="size-4" />;
    case "webhook":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Link04Icon}
        />
      );
    case "manual":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={PlayCircleIcon}
        />
      );
    case "schedule":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Calendar03Icon}
        />
      );
    case "events":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Notification03Icon}
        />
      );
    default: {
      return type;
    }
  }
}
