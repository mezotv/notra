"use client";

import {
  Loading03Icon,
  PlugSocketIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/button";
import { MAX_TOOL_ACTION_PHRASE_LENGTH } from "@/schemas/integrations";
import type { McpIntegrationTool, ToolPhraseDraft } from "@/types/integrations";

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
  return "No tools found yet. Check the server URL and credentials, then rescan.";
}

function PhrasePreview({ past, present }: { past: string; present: string }) {
  if (!(present.trim() || past.trim())) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
      <span>In chat:</span>
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
        <HugeiconsIcon className="size-3" icon={Loading03Icon} />
        {present.trim() || "Running tool"}
      </span>
      <span>→</span>
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
        <HugeiconsIcon className="size-3" icon={Tick02Icon} />
        {past.trim() || "Ran tool"}
      </span>
    </div>
  );
}

export function ToolsEditor({
  drafts,
  oauth,
  onDraftChange,
  onScan,
  saving,
  scanning,
  tools,
}: {
  drafts: Record<string, ToolPhraseDraft>;
  oauth: boolean;
  onDraftChange: (
    serverToolName: string,
    field: "actionPhrasePresent" | "actionPhrasePast",
    value: string
  ) => void;
  onScan: () => void;
  saving: boolean;
  scanning: boolean;
  tools: McpIntegrationTool[];
}) {
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
          {oauth ? <>Connect &amp; scan</> : <>Rescan tools</>}
        </Button>
        <p className="text-muted-foreground text-xs">
          {oauth
            ? "Signs in to the server to read its tools."
            : "Reads the tool list from your server. Runs automatically after you create the integration."}
        </p>
      </div>

      {tools.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
          {getEmptyStateMessage({ oauth, scanning })}
        </p>
      ) : null}

      {tools.map((tool) => {
        const draft = drafts[tool.serverToolName];
        const present = draft?.actionPhrasePresent ?? "";
        const past = draft?.actionPhrasePast ?? "";

        return (
          <div className="grid gap-3 rounded-lg border p-4" key={tool.id}>
            <div className="flex items-center justify-between gap-2">
              <code className="min-w-0 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs">
                {tool.serverToolName}
              </code>
              {tool.description ? (
                <p className="hidden max-w-[50%] truncate text-muted-foreground text-xs sm:block">
                  {tool.description}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
            <PhrasePreview past={past} present={present} />
          </div>
        );
      })}
    </div>
  );
}
