import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { cn } from "@notra/ui/lib/utils";

function RunContentAgentButton({
  className,
  children = "Run content agent",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn("gap-2 px-3", className)} {...props}>
      <HugeiconsIcon icon={SparklesIcon} />
      {children}
    </Button>
  );
}

export { RunContentAgentButton };
