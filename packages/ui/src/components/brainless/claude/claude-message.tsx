import type * as React from "react";
import { cn } from "@notra/ui/lib/utils";

export function ClaudeMessage({
  from: author = "assistant",
  className,
  children,
}: {
  from?: "user" | "assistant";
  className?: string;
  children: React.ReactNode;
}) {
  if (author === "user") {
    return (
      <div
        className={cn(
          "flex w-full min-w-0 items-baseline font-mono text-[13px] leading-[1.55]",
          className
        )}
        style={{ background: "#3a3a3a" }}
      >
        <span aria-hidden className="shrink-0" style={{ color: "#4e4e4e" }}>
          ❯
        </span>
        <span
          aria-hidden
          className="shrink-0"
          style={{ display: "inline-block", width: "1ch" }}
        />
        <span className="min-w-0 flex-1 break-words" style={{ color: "#ffffff" }}>
          {children}
        </span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "font-mono text-[#c0caf5] text-[13px] leading-[1.6]",
        className
      )}
    >
      {children}
    </div>
  );
}
