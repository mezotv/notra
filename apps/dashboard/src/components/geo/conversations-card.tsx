"use client";

import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ConversationRow } from "@notra/ui/components/geo/conversation-row";
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
              <ConversationRow
                enabled={sequence.enabled}
                key={sequence.id}
                name={sequence.name}
                onDelete={() => removeSequence(sequence.id)}
                onEdit={() => {
                  setEditing(sequence);
                  setBuilderOpen(true);
                }}
                onOpen={() => setViewing(sequence)}
                onToggle={(enabled) => updateSequence(sequence.id, { enabled })}
                pending={pendingSequenceIds.has(sequence.id)}
                steps={sequence.steps}
              />
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
