import { cn } from "@notra/ui/lib/utils";

export type ClaudeTodo = {
  label: string;
  status: "done" | "active" | "todo";
};

const DONE = "#87d787";
const ACTIVE = "#d78787";
const DIM = "#949494";

const ICON: Record<ClaudeTodo["status"], string> = {
  done: "✔",
  active: "◼",
  todo: "◻",
};

const STATUS_LABEL: Record<ClaudeTodo["status"], string> = {
  done: "completed",
  active: "in progress",
  todo: "pending",
};

export function ClaudeTodoList({
  todos,
  className,
}: {
  todos: ClaudeTodo[];
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "font-mono text-[#c0caf5] text-[13px] leading-[1.6]",
        className
      )}
    >
      {todos.map((t, i) => {
        let iconColor = DIM;
        if (t.status === "done") {
          iconColor = DONE;
        } else if (t.status === "active") {
          iconColor = ACTIVE;
        }

        return (
          <li className="whitespace-pre" key={`${t.label}-${t.status}`}>
            <span aria-hidden style={{ color: DIM }}>
              {i === 0 ? "  ⎿ " : "    "}
            </span>
            <span aria-hidden style={{ color: iconColor }}>
              {ICON[t.status]}{" "}
            </span>
            <span
              className={cn(
                t.status === "done" && "line-through",
                t.status === "active" && "font-semibold"
              )}
              style={{
                color: t.status === "active" ? "#ffffff" : DIM,
              }}
            >
              {t.label}
              <span className="sr-only"> ({STATUS_LABEL[t.status]})</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
