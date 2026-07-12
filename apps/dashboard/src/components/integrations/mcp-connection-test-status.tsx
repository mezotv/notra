import { Alert01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loader2Icon } from "lucide-react";
import type { McpConnectionTestStatusProps } from "@/types/integrations/mcp";

export function McpConnectionTestStatus({
  message,
  status,
}: McpConnectionTestStatusProps) {
  if (status === "idle") {
    return null;
  }
  return (
    <output
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-sm"
    >
      {status === "testing" ? (
        <>
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Testing connection...</span>
        </>
      ) : null}
      {status === "success" ? (
        <>
          <HugeiconsIcon
            className="size-4 text-emerald-600 dark:text-emerald-400"
            icon={CheckmarkCircle02Icon}
          />
          <span>{message || "Connection successful"}</span>
        </>
      ) : null}
      {status === "error" ? (
        <>
          <HugeiconsIcon
            className="size-4 text-destructive"
            icon={Alert01Icon}
          />
          <span className="text-destructive">
            {message || "Could not reach the server"}
          </span>
        </>
      ) : null}
    </output>
  );
}
