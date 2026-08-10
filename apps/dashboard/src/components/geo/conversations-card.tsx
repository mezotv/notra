"use client";

import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { Switch } from "@notra/ui/components/ui/switch";
import { useState } from "react";
import { ConversationBuilderDialog } from "@/components/geo/conversation-builder-dialog";
import { ConversationResultsDialog } from "@/components/geo/conversation-results-dialog";
import {
  InstrumentEmpty,
  InstrumentSection,
} from "@/components/instrument/instrument-module";
import {
  useGeoSequenceDelete,
  useGeoSequences,
  useGeoSequenceUpdate,
} from "@/lib/hooks/use-geo";
import type { ConversationsCardProps, GeoPromptSequence } from "@/types/geo";

export function ConversationsCard({ organizationId }: ConversationsCardProps) {
  const { data } = useGeoSequences(organizationId);
  const update = useGeoSequenceUpdate(organizationId);
  const remove = useGeoSequenceDelete(organizationId);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<GeoPromptSequence | null>(null);
  const [viewing, setViewing] = useState<GeoPromptSequence | null>(null);

  const sequences = data?.sequences ?? [];

  return (
    <InstrumentSection
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setBuilderOpen(true);
          }}
          size="sm"
          variant="outline"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} />
          New conversation
        </Button>
      }
      eyebrow={
        sequences.length > 0
          ? `Conversations (${sequences.length.toLocaleString()})`
          : "Conversations"
      }
    >
      {sequences.length === 0 ? (
        <InstrumentEmpty
          className="h-32"
          message="Track multi-turn conversations: an opening question plus the follow-ups where buying decisions happen"
          seed="geo-conversations"
        />
      ) : (
        <div className="divide-y divide-border/60">
          {sequences.map((sequence) => (
            <div className="flex items-center gap-3 py-2.5" key={sequence.id}>
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => setViewing(sequence)}
                type="button"
              >
                <p className="truncate font-medium text-sm">{sequence.name}</p>
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
                <Switch
                  checked={sequence.enabled}
                  disabled={update.isPending}
                  onCheckedChange={(enabled) =>
                    update.mutate({ sequenceId: sequence.id, enabled })
                  }
                />
                <Button
                  aria-label={`Delete ${sequence.name}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ sequenceId: sequence.id })}
                  size="icon"
                  variant="ghost"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
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
    </InstrumentSection>
  );
}
