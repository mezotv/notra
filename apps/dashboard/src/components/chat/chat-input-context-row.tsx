import { CpuIcon, TextSelectionIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ContextItem, TextSelection } from "@notra/ai/types/chat";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { Composer } from "@/components/composer/composer-shell";
import { McpIcon } from "@/components/integrations/mcp-icon";
import type { ChatInputContextRowProps } from "@/types/components/chat-input";
import { contextItemKey, getSelectionPreview } from "@/utils/chat-input";
import { getReferenceDisplay } from "@/utils/integration-reference";

function ContextChipIcon({ item }: { item: ContextItem }) {
  if (item.type === "github-repo") {
    return <Github className="size-3.5 shrink-0" />;
  }
  if (item.type === "linear-team") {
    return <Linear className="size-3.5 shrink-0" />;
  }
  return <McpIcon className="size-3.5" />;
}

function SelectionChip({
  selection,
  onClearSelection,
}: {
  selection: TextSelection;
  onClearSelection?: () => void;
}) {
  const previewText = getSelectionPreview(selection);
  const label = `L${selection.startLine}:${selection.startChar} → L${selection.endLine}:${selection.endChar}`;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex max-w-full" />}>
        <Composer.Chip
          icon={
            <HugeiconsIcon
              className="size-3.5 shrink-0 text-muted-foreground"
              icon={TextSelectionIcon}
            />
          }
          label={label}
          onRemove={onClearSelection}
          removeLabel="Remove selection"
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">Selected text</p>
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
}: ChatInputContextRowProps) {
  if (context.length === 0 && !selection) {
    return null;
  }

  return (
    <>
      {context.map((item) => {
        const label = getReferenceDisplay(item);
        return (
          <Composer.Chip
            icon={<ContextChipIcon item={item} />}
            key={contextItemKey(item)}
            label={label}
            onRemove={
              onRemoveContext
                ? () => {
                    onRemoveContext(item);
                  }
                : undefined
            }
            removeLabel={`Remove ${label}`}
          />
        );
      })}
      {selection ? (
        <SelectionChip
          onClearSelection={onClearSelection}
          selection={selection}
        />
      ) : null}
    </>
  );
}
