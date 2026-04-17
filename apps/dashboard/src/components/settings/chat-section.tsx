"use client";

import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useShowAgentStats } from "@/lib/hooks/use-privacy-preferences";

export function ChatSection() {
  const { showAgentStats, hasHydrated, isUpdating, setShowAgentStats } =
    useShowAgentStats();

  return (
    <TitleCard className="lg:col-span-2" heading="Chat">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Customize how assistant messages appear in chat
        </p>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="min-w-0 space-y-1">
            <Label
              className="cursor-pointer font-medium text-sm"
              htmlFor="show-agent-stats"
            >
              Agent stats
            </Label>
            <p className="text-muted-foreground text-xs">
              Show model, tokens per second, total tokens, and time to first
              token under assistant messages. Inspired by{" "}
              <a
                className="underline underline-offset-2 hover:text-foreground"
                href="https://t3.chat"
                rel="noopener"
                target="_blank"
              >
                t3.chat
              </a>
              .
            </p>
          </div>
          <Switch
            checked={showAgentStats}
            disabled={!hasHydrated || isUpdating}
            id="show-agent-stats"
            onCheckedChange={setShowAgentStats}
          />
        </div>
      </div>
    </TitleCard>
  );
}
