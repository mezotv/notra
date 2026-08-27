"use client";

import {
  Delete02Icon,
  Download01Icon,
  PlugSocketIcon,
  PlusSignIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { ToolChatPreview } from "@/components/integrations/tool-chat-preview";
import {
  buildToolPhrasesJsonc,
  downloadTextFile,
  isManualTool,
  parseToolPhrasesFile,
} from "@/lib/integrations/tool-io";
import { MAX_TOOL_ACTION_PHRASE_LENGTH } from "@/schemas/integrations";
import type { ToolsEditorProps } from "@/types/integrations";

function getEmptyStateMessage({
  oauth,
  scanning,
}: {
  oauth: boolean;
  scanning: boolean;
}) {
  if (scanning) {
    return "Reading tools from your server...";
  }
  if (oauth) {
    return "Connect with OAuth to discover this server's tools.";
  }
  return "No tools yet. Connect & scan reads them from your server.";
}

export function ToolsEditor({
  drafts,
  oauth,
  onAddTool,
  onDraftChange,
  onImportTools,
  onRemoveTool,
  onScan,
  saving,
  scanning,
  serverLogoDarkUrl,
  serverLogoLightUrl,
  serverName,
  serverUrl,
  tools,
}: ToolsEditorProps) {
  const [newToolName, setNewToolName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTool = () => {
    const name = newToolName.trim();
    if (!name) {
      return;
    }
    if (tools.some((tool) => tool.serverToolName === name)) {
      toast.error(`"${name}" is already in the list`);
      return;
    }
    onAddTool(name);
    setNewToolName("");
  };

  const handleDownload = () => {
    downloadTextFile(
      "tool-phrases.jsonc",
      buildToolPhrasesJsonc(tools, drafts)
    );
  };

  const handleUpload = async (file: File) => {
    try {
      onImportTools(parseToolPhrasesFile(await file.text()));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not read that file"
      );
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={scanning || saving}
          onClick={onScan}
          type="button"
          variant="outline"
        >
          {scanning ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <HugeiconsIcon className="size-4" icon={PlugSocketIcon} />
          )}
          {oauth || tools.length === 0 ? (
            <>Connect &amp; scan</>
          ) : (
            <>Rescan tools</>
          )}
        </Button>
        <p className="text-muted-foreground text-xs">
          {oauth
            ? "Signs in to the server to read its tools. The sign-in is used for this scan only and never stored."
            : "Reads the tool list from your server."}
        </p>
      </div>

      {tools.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
          {getEmptyStateMessage({ oauth, scanning })}
        </p>
      ) : null}

      {tools.map((tool) => {
        const draft = drafts[tool.serverToolName];
        const present = draft?.actionPhrasePresent ?? "";
        const past = draft?.actionPhrasePast ?? "";

        return (
          <div
            className="grid min-w-0 gap-3 rounded-lg border p-4"
            key={tool.id}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="grid min-w-0 gap-1">
                <code className="bg-muted w-fit max-w-full truncate rounded-md px-2 py-1 font-mono text-xs">
                  {tool.serverToolName}
                </code>
                {tool.description ? (
                  <p className="text-muted-foreground line-clamp-2 text-xs break-words">
                    {tool.description}
                  </p>
                ) : null}
              </div>
              {isManualTool(tool) ? (
                <Button
                  aria-label={`Remove ${tool.serverToolName}`}
                  disabled={saving}
                  onClick={() => onRemoveTool(tool.serverToolName)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                </Button>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label
                  className="text-muted-foreground text-xs"
                  htmlFor={`phrase-present-${tool.id}`}
                >
                  While it runs
                </Label>
                <Input
                  disabled={saving}
                  id={`phrase-present-${tool.id}`}
                  maxLength={MAX_TOOL_ACTION_PHRASE_LENGTH}
                  onChange={(event) =>
                    onDraftChange(
                      tool.serverToolName,
                      "actionPhrasePresent",
                      event.target.value
                    )
                  }
                  placeholder="Searching your Linear issues"
                  value={present}
                />
              </div>
              <div className="grid gap-1.5">
                <Label
                  className="text-muted-foreground text-xs"
                  htmlFor={`phrase-past-${tool.id}`}
                >
                  After it ran
                </Label>
                <Input
                  disabled={saving}
                  id={`phrase-past-${tool.id}`}
                  maxLength={MAX_TOOL_ACTION_PHRASE_LENGTH}
                  onChange={(event) =>
                    onDraftChange(
                      tool.serverToolName,
                      "actionPhrasePast",
                      event.target.value
                    )
                  }
                  placeholder="Searched your Linear issues"
                  value={past}
                />
              </div>
            </div>
            <ToolChatPreview
              logoDarkUrl={serverLogoDarkUrl}
              logoLightUrl={serverLogoLightUrl}
              past={past}
              present={present}
              serverName={serverName}
              serverUrl={serverUrl}
              toolName={tool.serverToolName}
            />
          </div>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <Input
            aria-label="New tool name"
            className="h-8 w-44 font-mono text-xs"
            disabled={saving}
            onChange={(event) => setNewToolName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddTool();
              }
            }}
            placeholder="tool_name"
            value={newToolName}
          />
          <Button
            disabled={saving || !newToolName.trim()}
            onClick={handleAddTool}
            size="sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={PlusSignIcon} />
            Add a tool manually
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={tools.length === 0}
            onClick={handleDownload}
            size="sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={Download01Icon} />
            Download JSONC
          </Button>
          <Button
            disabled={saving}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon className="size-4" icon={Upload01Icon} />
            Upload JSON / JSONC
          </Button>
        </div>
        <input
          accept=".json,.jsonc,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              handleUpload(file);
            }
            event.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />
      </div>
    </div>
  );
}
