import { cn } from "@notra/ui/lib/utils";

export type CodexExecStatus = "ran" | "running" | "failed";

const FG = "#ececec";
const DIM = "#8a8a8a";
const GREEN = "#2f9d63";
const AMBER = "#d29922";
const RED = "#e05a5a";

const STATUS_LABEL: Record<CodexExecStatus, string> = {
  ran: "Ran",
  running: "Running",
  failed: "Failed",
};

const STATUS_COLOR: Record<CodexExecStatus, string> = {
  ran: GREEN,
  running: AMBER,
  failed: RED,
};

export function CodexExec({
  command,
  output,
  status = "ran",
  className,
}: {
  command: string;
  output?: string;
  status?: CodexExecStatus;
  className?: string;
}) {
  return (
    <div
      className={cn("font-mono text-[13px] leading-[1.55]", className)}
      style={{ color: FG }}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <span aria-hidden className="shrink-0" style={{ color: DIM }}>
          •
        </span>
        <span className="min-w-0 break-words">
          <span style={{ color: STATUS_COLOR[status] }}>
            {STATUS_LABEL[status]}
          </span>
          <span style={{ color: DIM }}> {command}</span>
        </span>
      </div>
      {output ? (
        <pre
          className="mt-1 whitespace-pre-wrap pl-[1.15rem]"
          style={{ color: DIM }}
        >
          {output}
        </pre>
      ) : null}
    </div>
  );
}
