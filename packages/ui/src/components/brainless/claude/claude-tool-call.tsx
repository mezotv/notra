import type * as React from "react";
import { cn } from "@notra/ui/lib/utils";

export type ClaudeToolCallStatus = "success" | "error" | "pending";

const STATUS_COLOR: Record<ClaudeToolCallStatus, string> = {
  success: "#4ea96f",
  error: "#f7768e",
  pending: "#e0af68",
};

export function ClaudeToolCall({
  tool,
  arg,
  result,
  status = "success",
  defaultOpen = false,
  className,
  children,
}: {
  tool: string;
  arg?: string;
  result: string;
  status?: ClaudeToolCallStatus;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const expandable = Boolean(children);

  return (
    <details
      className={cn(
        "group font-mono text-[13px] leading-[1.55] [&_summary::-webkit-details-marker]:hidden",
        className
      )}
      open={defaultOpen}
    >
      <summary
        className={cn(
          "list-none",
          expandable ? "cursor-pointer" : "cursor-default",
          "rounded-none outline-none focus-visible:ring-1 focus-visible:ring-[#7dcfff]/60"
        )}
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span
            aria-hidden
            className="shrink-0"
            style={{ color: STATUS_COLOR[status] }}
          >
            ⏺
          </span>
          <span className="min-w-0 break-words">
            <span className="text-[#c0caf5]">{tool}</span>
            {arg === undefined ? null : (
              <>
                <span className="text-[#565f89]">(</span>
                <span className="text-[#7dcfff]">{arg}</span>
                <span className="text-[#565f89]">)</span>
              </>
            )}
          </span>
        </span>
        <span className="flex min-w-0 items-baseline gap-2 text-[#8b8fa3]">
          <span aria-hidden className="invisible shrink-0">
            ⏺
          </span>
          <span className="flex min-w-0 items-baseline gap-2">
            <span aria-hidden className="shrink-0 text-[#565f89]">
              ⎿
            </span>
            <span className="min-w-0 break-words">
              {result}
              {expandable ? (
                <span className="ml-2 text-[#565f89] group-open:hidden">
                  (click to expand)
                </span>
              ) : null}
            </span>
          </span>
        </span>
      </summary>

      {expandable ? (
        <div className="mt-1 whitespace-pre-wrap pl-[32px] text-[#8b8fa3]">
          {children}
        </div>
      ) : null}
    </details>
  );
}
