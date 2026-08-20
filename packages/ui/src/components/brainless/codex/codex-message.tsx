import type * as React from "react";
import { cn } from "@notra/ui/lib/utils";

const FG = "#ececec";
const GREEN = "#2f9d63";

export function CodexMessage({
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
      >
        <span aria-hidden className="shrink-0" style={{ color: GREEN }}>
          ›
        </span>
        <span
          aria-hidden
          className="shrink-0"
          style={{ display: "inline-block", width: "1ch" }}
        />
        <span className="min-w-0 flex-1 break-words" style={{ color: FG }}>
          {children}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "font-mono text-[13px] leading-[1.6]",
        className
      )}
      style={{ color: FG }}
    >
      {children}
    </div>
  );
}
