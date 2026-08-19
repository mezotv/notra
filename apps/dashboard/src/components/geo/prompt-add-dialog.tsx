"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@notra/ui/components/ui/input-group";
import { Label } from "@notra/ui/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@notra/ui/components/ui/tabs";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { type FormEvent, useId, useState } from "react";
import { StatusSpinner } from "@/components/geo/status-spinner";
import { GEO_PROMPT_MAX_LENGTH, GEO_PROMPT_MIN_LENGTH } from "@/constants/geo";
import {
  useGeoGenerateFromWebsite,
  useGeoPromptCreate,
} from "@/lib/hooks/use-geo";
import type { PromptAddDialogProps, PromptAddMode } from "@/types/geo";
import { normalizeWebsiteUrl, stripWebsiteProtocol } from "@/utils/geo-website";

function toPromptAddMode(value: string): PromptAddMode {
  return value === "website" ? "website" : "write";
}

export function PromptAddDialog({
  open,
  onOpenChange,
  organizationId,
}: PromptAddDialogProps) {
  const formId = useId();
  const promptId = useId();
  const promptHintId = useId();
  const urlId = useId();
  const urlHintId = useId();
  const [mode, setMode] = useState<PromptAddMode>("write");
  const [draft, setDraft] = useState("");
  const [url, setUrl] = useState("");
  const create = useGeoPromptCreate(organizationId);
  const generate = useGeoGenerateFromWebsite(organizationId);

  const trimmed = draft.trim();
  const remainingToMin = GEO_PROMPT_MIN_LENGTH - trimmed.length;
  const canAdd =
    trimmed.length >= GEO_PROMPT_MIN_LENGTH &&
    trimmed.length <= GEO_PROMPT_MAX_LENGTH &&
    !create.isPending;
  const normalizedUrl = normalizeWebsiteUrl(url);
  const busy = create.isPending || generate.isPending;
  const canGenerate = normalizedUrl !== null && !busy;

  const close = () => {
    setMode("write");
    setDraft("");
    setUrl("");
    onOpenChange(false);
  };

  const handleAdd = () => {
    if (!canAdd) {
      return;
    }
    create.mutate({ prompt: trimmed }, { onSuccess: close });
  };

  const handleGenerate = () => {
    if (!normalizedUrl || !canGenerate) {
      return;
    }
    generate.mutate({ url: normalizedUrl }, { onSuccess: close });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === "website") {
      handleGenerate();
      return;
    }
    handleAdd();
  };

  return (
    <ResponsiveDialog
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        close();
      }}
      open={open}
    >
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add prompt</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {mode === "website"
              ? "Generate more buyer questions from a site you already have."
              : "A question your buyers ask AI engines."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          className="space-y-4 px-4 md:px-0"
          id={formId}
          onSubmit={handleSubmit}
        >
          <Tabs
            onValueChange={(value) => setMode(toPromptAddMode(value))}
            value={mode}
          >
            <TabsList className="grid h-9 w-full grid-cols-2">
              <TabsTrigger disabled={busy} value="write">
                Write one
              </TabsTrigger>
              <TabsTrigger disabled={busy} value="website">
                From a website
              </TabsTrigger>
            </TabsList>
            <TabsContent className="mt-4" value="write">
              <div className="space-y-2">
                <Label htmlFor={promptId}>Question</Label>
                <Textarea
                  aria-describedby={promptHintId}
                  autoFocus
                  disabled={create.isPending}
                  id={promptId}
                  maxLength={GEO_PROMPT_MAX_LENGTH}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      event.preventDefault();
                      handleAdd();
                    }
                  }}
                  placeholder="What's the best tool for automating changelogs?"
                  rows={4}
                  value={draft}
                />
                <p
                  className="text-muted-foreground text-xs tabular-nums"
                  id={promptHintId}
                >
                  {remainingToMin > 0 && trimmed.length > 0
                    ? `${remainingToMin} more characters`
                    : `${trimmed.length}/${GEO_PROMPT_MAX_LENGTH}`}
                </p>
              </div>
            </TabsContent>
            <TabsContent className="mt-4" value="website">
              <div className="space-y-2">
                <Label htmlFor={urlId}>Website</Label>
                <InputGroup>
                  <InputGroupAddon className="border-input border-r pr-2">
                    <InputGroupText>https://</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-describedby={urlHintId}
                    autoComplete="url"
                    autoFocus
                    disabled={generate.isPending}
                    id={urlId}
                    inputMode="url"
                    onChange={(event) =>
                      setUrl(stripWebsiteProtocol(event.target.value))
                    }
                    placeholder="yourcompany.com"
                    value={url}
                  />
                </InputGroup>
                <p className="text-muted-foreground text-xs" id={urlHintId}>
                  We'll add buyer questions, plus aliases and competitors.
                  Existing prompts stay.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </form>
        <ResponsiveDialogFooter>
          <Button
            disabled={busy}
            onClick={close}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          {mode === "website" ? (
            <Button disabled={!canGenerate} form={formId} type="submit">
              {generate.isPending ? <StatusSpinner /> : null}
              Generate prompts
            </Button>
          ) : (
            <Button disabled={!canAdd} form={formId} type="submit">
              {create.isPending ? <StatusSpinner /> : null}
              Add prompt
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
