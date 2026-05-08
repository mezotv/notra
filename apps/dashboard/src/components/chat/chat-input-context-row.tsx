import { Cancel01Icon, TextSelectionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ContextItem, TextSelection } from "@notra/ai/types/chat";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { getSelectionPreview } from "@/utils/chat-input";

function ContextBadge({
  item,
  onRemove,
}: {
  item: ContextItem;
  onRemove?: (item: ContextItem) => void;
}) {
  const label =
    item.type === "github-repo"
      ? `${item.owner}/${item.repo}`
      : item.teamName || "Linear";

  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-foreground text-xs">
      {item.type === "github-repo" ? (
        <Github className="size-3.5" />
      ) : (
        <Linear className="size-3.5" />
      )}
      <span className="font-medium">{label}</span>
      <button
        aria-label={`Remove ${label} from context`}
        className="ml-0.5 cursor-pointer rounded p-0.5 transition-colors hover:bg-accent"
        onClick={() => onRemove?.(item)}
        type="button"
      >
        <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
      </button>
    </div>
  );
}

function SelectionBadge({
  selection,
  onClearSelection,
}: {
  selection: TextSelection;
  onClearSelection?: () => void;
}) {
  const previewText = getSelectionPreview(selection);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-foreground text-xs" />
        }
      >
        <HugeiconsIcon
          className="size-3.5 text-muted-foreground"
          icon={TextSelectionIcon}
        />
        <span className="font-medium">
          L{selection.startLine}:{selection.startChar} → L{selection.endLine}:
          {selection.endChar}
        </span>
        <button
          aria-label="Remove selection"
          className="ml-0.5 cursor-pointer rounded p-0.5 transition-colors hover:bg-accent"
          onClick={onClearSelection}
          type="button"
        >
          <HugeiconsIcon className="size-3" icon={Cancel01Icon} />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">Selected Text</p>
          <p className="text-xs opacity-70">
            From line {selection.startLine}, character {selection.startChar} to
            line {selection.endLine}, character {selection.endChar}
          </p>
          <p className="line-clamp-3 whitespace-pre-wrap break-all text-xs opacity-80">
            "{previewText}"
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function ChatInputContextRow({
  context,
  selection,
  onRemoveContext,
  onClearSelection,
}: {
  context: ContextItem[];
  selection?: TextSelection | null;
  onRemoveContext?: (item: ContextItem) => void;
  onClearSelection?: () => void;
}) {
  if (context.length === 0 && !selection) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 pt-2 pb-1">
      {context.map((item) => (
        <ContextBadge
          item={item}
          key={`${item.type}-${item.integrationId}`}
          onRemove={onRemoveContext}
        />
      ))}
      {selection && (
        <SelectionBadge
          onClearSelection={onClearSelection}
          selection={selection}
        />
      )}
    </div>
  );
}
