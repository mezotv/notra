import type { ReactNode } from "react";
import { cn } from "@notra/ui/lib/utils";

export type ChatgptMessageRole = "user" | "assistant";

export function ChatgptMessage({
  from,
  reasoning,
  actions,
  className,
  children,
}: {
  from: ChatgptMessageRole;
  reasoning?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  if (from === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="max-w-[70%] rounded-[1.5rem] bg-[#e8edf4] px-[18px] py-2.5 text-[15px] leading-6 text-foreground dark:bg-white/10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {reasoning}
      <div className="max-w-full text-[15px] leading-7 text-foreground">
        {children}
      </div>
      {actions ? <div className="-ms-2">{actions}</div> : null}
    </div>
  );
}
