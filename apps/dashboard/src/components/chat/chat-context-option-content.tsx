import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";

import { McpIcon } from "@/components/integrations/mcp-icon";
import type { ChatContextOptionContentProps } from "@/types/components/chat-input";

export function ChatContextOptionContent({
  option,
}: ChatContextOptionContentProps) {
  return (
    <>
      {option.kind === "github" && <Github className="size-4 shrink-0" />}
      {option.kind === "linear" && <Linear className="size-4 shrink-0" />}
      {option.kind === "mcp" && (
        <McpIcon darkUrl={option.logoDarkUrl} lightUrl={option.logoLightUrl} />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm">{option.label}</span>
        <span className="text-muted-foreground truncate text-xs">
          {option.description}
        </span>
      </span>
    </>
  );
}
