"use client";

import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useState } from "react";
import { Button } from "@/components/button";
import { ConversationBuilderDialog } from "@/components/geo/conversation-builder-dialog";
import { ConversationResultsDialog } from "@/components/geo/conversation-results-dialog";
import { useGeoSequencesDb } from "@/lib/hooks/use-geo-db";
import type { ConversationsCardProps, GeoPromptSequence } from "@/types/geo";

export function ConversationsCard({ organizationId }: ConversationsCardProps) {
  const { sequences, pendingSequenceIds, updateSequence, removeSequence } =
    useGeoSequencesDb(organizationId);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<GeoPromptSequence | null>(null);
  const [viewing, setViewing] = useState<GeoPromptSequence | null>(null);

  return (
    <Card className="overflow-visible rounded-2xl bg-transparent p-0 ring-0">
      <CardHeader className="rounded-t-2xl border border-border border-b-0 bg-muted pt-4 pb-9">
        <CardTitle>Conversations</CardTitle>
        <CardDescription>
          Multi-turn questions where buying decisions happen
        </CardDescription>
        <CardAction>
          <Button
            onClick={() => {
              setEditing(null);
              setBuilderOpen(true);
            }}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            New Conversation
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="-mt-9 relative rounded-2xl border border-border bg-card pt-2 pb-2">
        {sequences.length === 0 ? (
          <p className="flex h-32 items-center justify-center text-center text-muted-foreground text-sm">
            Track an opening question plus the follow-ups that close the deal
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {sequences.map((sequence) => (
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                key={sequence.id}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setViewing(sequence)}
                  type="button"
                >
                  <p className="truncate font-medium text-sm">
                    {sequence.name}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {sequence.steps.length}{" "}
                    {sequence.steps.length === 1 ? "turn" : "turns"} ·{" "}
                    {sequence.steps[0]}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    onClick={() => {
                      setEditing(sequence);
                      setBuilderOpen(true);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Switch
                          aria-label={
                            sequence.enabled
                              ? `Pause ${sequence.name}`
                              : `Enable ${sequence.name}`
                          }
                          checked={sequence.enabled}
                          disabled={pendingSequenceIds.has(sequence.id)}
                          onCheckedChange={(enabled) =>
                            updateSequence(sequence.id, { enabled })
                          }
                          size="sm"
                        />
                      }
                    />
                    <TooltipContent>
                      {sequence.enabled
                        ? "Included in scans"
                        : "Paused — skipped in scans"}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label={`Delete ${sequence.name}`}
                          disabled={pendingSequenceIds.has(sequence.id)}
                          onClick={() => removeSequence(sequence.id)}
                          size="icon"
                          variant="ghost"
                        />
                      }
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ConversationBuilderDialog
        key={editing?.id ?? "new"}
        onOpenChange={(next) => {
          setBuilderOpen(next);
          if (!next) {
            setEditing(null);
          }
        }}
        open={builderOpen}
        organizationId={organizationId}
        sequence={editing}
      />
      <ConversationResultsDialog
        onOpenChange={(next) => {
          if (!next) {
            setViewing(null);
          }
        }}
        open={viewing !== null}
        organizationId={organizationId}
        sequence={viewing}
      />
    </Card>
  );
}
