"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@notra/ui/components/ui/card";
import { Input } from "@notra/ui/components/ui/input";
import { Switch } from "@notra/ui/components/ui/switch";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { PromptLanguageSelect } from "@/components/geo/prompt-language-select";
import {
  useGeoPromptCreate,
  useGeoPromptDelete,
  useGeoPromptLanguagesUpdate,
  useGeoPrompts,
  useGeoPromptToggle,
} from "@/lib/hooks/use-geo";
import type { GeoLanguageCode, GeoTrackedPrompt } from "@/types/geo";
import { toGeoLanguageCodes } from "@/utils/geo-languages";

interface PromptManagerProps {
  organizationId: string;
}

const MIN_PROMPT_LENGTH = 8;

function PromptRow({
  prompt,
  organizationId,
}: {
  prompt: GeoTrackedPrompt;
  organizationId: string;
}) {
  const toggle = useGeoPromptToggle(organizationId);
  const remove = useGeoPromptDelete(organizationId);
  const updateLanguages = useGeoPromptLanguagesUpdate(organizationId);

  return (
    <div className="flex items-center gap-3 py-2.5">
      <p className="min-w-0 flex-1 text-sm">{prompt.prompt}</p>
      {prompt.source === "auto" ? (
        <Badge className="shrink-0" variant="outline">
          Auto
        </Badge>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <PromptLanguageSelect
            disabled={updateLanguages.isPending}
            onChange={(languages) =>
              updateLanguages.mutate({ promptId: prompt.id, languages })
            }
            value={toGeoLanguageCodes(prompt.languages)}
          />
          <Switch
            checked={prompt.enabled}
            disabled={toggle.isPending}
            onCheckedChange={(enabled) =>
              toggle.mutate({ promptId: prompt.id, enabled })
            }
          />
          <Button
            aria-label="Delete prompt"
            disabled={remove.isPending}
            onClick={() => remove.mutate({ promptId: prompt.id })}
            size="icon"
            variant="ghost"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

export function PromptManager({ organizationId }: PromptManagerProps) {
  const [draft, setDraft] = useState("");
  const [draftLanguages, setDraftLanguages] = useState<GeoLanguageCode[]>([]);
  const { data } = useGeoPrompts(organizationId);
  const create = useGeoPromptCreate(organizationId);

  const prompts = data?.prompts ?? [];
  const customPrompts = prompts.filter((prompt) => prompt.source === "custom");
  const autoPrompts = prompts.filter((prompt) => prompt.source === "auto");

  const handleAdd = () => {
    const prompt = draft.trim();
    if (prompt.length < MIN_PROMPT_LENGTH) {
      return;
    }
    create.mutate(
      { prompt, languages: draftLanguages },
      {
        onSuccess: () => {
          setDraft("");
          setDraftLanguages([]);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked prompts</CardTitle>
        <CardDescription>
          Every scan asks each engine these questions. Add the questions your
          customers actually ask.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAdd();
              }
            }}
            placeholder="What's the best tool for automating changelogs?"
            value={draft}
          />
          <PromptLanguageSelect
            onChange={setDraftLanguages}
            value={draftLanguages}
          />
          <Button
            disabled={
              draft.trim().length < MIN_PROMPT_LENGTH || create.isPending
            }
            onClick={handleAdd}
          >
            {create.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Add
          </Button>
        </div>
        <div className="divide-y">
          {customPrompts.map((prompt) => (
            <PromptRow
              key={prompt.id}
              organizationId={organizationId}
              prompt={prompt}
            />
          ))}
          {autoPrompts.map((prompt) => (
            <PromptRow
              key={prompt.id}
              organizationId={organizationId}
              prompt={prompt}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
