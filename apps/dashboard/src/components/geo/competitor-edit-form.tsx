"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import {
  Cancel01Icon,
  InformationCircleIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerSelection,
} from "@notra/ui/components/kibo-ui/color-picker";
import { Badge } from "@notra/ui/components/ui/badge";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  PermissionOption,
  PermissionRow,
  PermissionSelector,
} from "@notra/ui/components/ui/permission-selector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@notra/ui/components/ui/popover";
import { TooltipContent } from "@notra/ui/components/ui/tooltip";
import { useForm } from "@tanstack/react-form";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import Color from "color";
import { Loader2Icon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/button";
import { CompetitorLogoPreview } from "@/components/geo/competitor-logo-preview";
import { COMPETITOR_SWATCHES } from "@/constants/charts";
import { COMPETITOR_KIND_HINT, GEO_COLOR_DEBOUNCE_MS } from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { useGeoCompetitorUpsert } from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type { CompetitorEditFormProps, GeoCompetitorKind } from "@/types/geo";

function CompetitorSynonymsField({
  id,
  synonyms,
  onChange,
}: {
  id: string;
  synonyms: string[];
  onChange: (next: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const draftRef = useRef(draft);
  const skipCommitRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (adding || !restoreFocusRef.current) {
      return;
    }
    restoreFocusRef.current = false;
    addButtonRef.current?.focus();
  }, [adding]);

  const commitDraft = () => {
    const value = draftRef.current.trim();
    if (value.length === 0) {
      return;
    }
    const exists = synonyms.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );
    if (!exists) {
      onChange([...synonyms, value]);
    }
    draftRef.current = "";
    setDraft("");
  };

  const stopAdding = (restoreFocus: boolean) => {
    restoreFocusRef.current = restoreFocus;
    draftRef.current = "";
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={adding ? id : undefined}>
        Synonyms <span className="text-muted-foreground">(optional)</span>
      </Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {synonyms.map((synonym) => (
          <Badge className="gap-1 pr-1" key={synonym} variant="secondary">
            {synonym}
            <button
              aria-label={`Remove ${synonym}`}
              className="rounded-sm p-0.5 hover:bg-background"
              onClick={() =>
                onChange(synonyms.filter((item) => item !== synonym))
              }
              type="button"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={12} />
            </button>
          </Badge>
        ))}
        {adding ? (
          <Input
            autoFocus
            className="h-6 w-36 px-2 text-xs"
            id={id}
            onBlur={() => {
              if (!skipCommitRef.current) {
                commitDraft();
              }
              skipCommitRef.current = false;
              draftRef.current = "";
              setDraft("");
              setAdding(false);
            }}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                skipCommitRef.current = true;
                stopAdding(true);
              }
            }}
            placeholder="Another name"
            value={draft}
          />
        ) : (
          <button
            aria-label="Add synonym"
            className="inline-flex h-6 items-center gap-0.5 rounded-4xl border border-border border-dashed px-2 text-muted-foreground text-xs transition-colors hover:border-foreground/40 hover:text-foreground"
            onClick={() => setAdding(true)}
            ref={addButtonRef}
            type="button"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={12} strokeWidth={2} />
            Add
          </button>
        )}
      </div>
    </div>
  );
}

export function CompetitorEditForm({
  organizationId,
  competitor,
  onDone,
  onCancel,
}: CompetitorEditFormProps) {
  const upsert = useGeoCompetitorUpsert(organizationId);
  const nameId = useId();
  const websiteId = useId();
  const synonymId = useId();

  const form = useForm({
    defaultValues: {
      name: competitor?.name ?? "",
      website: competitor?.domain ?? "",
      synonyms: competitor?.synonyms ?? [],
      kind: competitor?.kind ?? ("direct" as GeoCompetitorKind),
      color: competitor?.color ?? "",
    },
    onSubmit: async ({ value }) => {
      await upsert.mutateAsync({
        name: value.name.trim(),
        domain: normalizeCompetitorDomain(value.website),
        synonyms: value.synonyms,
        kind: value.kind,
        color: value.color.length === 0 ? null : value.color,
      });
      if (!competitor) {
        form.reset();
      }
      onDone();
    },
  });

  const debouncedColorChange = useDebouncedCallback(
    (hex: string) => form.setFieldValue("color", hex),
    { wait: GEO_COLOR_DEBOUNCE_MS }
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              onChange={(event) => field.handleChange(event.target.value)}
              value={field.state.value}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="website">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={websiteId}>Website</Label>
            <div className="flex items-center gap-2">
              <CompetitorLogoPreview
                className="size-8"
                name={form.state.values.name || competitor?.name || "?"}
                website={field.state.value}
              />
              <Input
                id={websiteId}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="example.com"
                value={field.state.value}
              />
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="synonyms">
        {(field) => (
          <CompetitorSynonymsField
            id={synonymId}
            onChange={field.handleChange}
            synonyms={field.state.value}
          />
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => {
          const isCustom =
            field.state.value.length > 0 &&
            !COMPETITOR_SWATCHES.includes(field.state.value);
          return (
            <div className="space-y-2">
              <Label>Chart color</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {COMPETITOR_SWATCHES.map((swatch) => (
                  <button
                    aria-label={`Use ${swatch}`}
                    aria-pressed={field.state.value === swatch}
                    className={cn(
                      "size-6 rounded-full ring-offset-2 ring-offset-background transition-all",
                      field.state.value === swatch
                        ? "ring-2 ring-foreground"
                        : "hover:scale-110"
                    )}
                    key={swatch}
                    onClick={() => field.handleChange(swatch)}
                    style={{ backgroundColor: swatch }}
                    type="button"
                  />
                ))}
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        aria-label="Pick a custom color"
                        aria-pressed={isCustom}
                        className={cn(
                          "size-6 rounded-full border border-border ring-offset-2 ring-offset-background transition-colors",
                          isCustom
                            ? "ring-2 ring-foreground"
                            : "hover:border-foreground/40"
                        )}
                        style={{
                          backgroundColor: isCustom
                            ? field.state.value
                            : "#ffffff",
                        }}
                        type="button"
                      />
                    }
                  />
                  <PopoverContent
                    align="start"
                    className="w-64 p-3"
                    initialFocus={false}
                  >
                    <ColorPicker
                      className="w-full gap-3"
                      onChange={(value) =>
                        debouncedColorChange(Color.rgb(value).hex())
                      }
                      value={
                        isCustom
                          ? field.state.value
                          : field.state.value || "#ffffff"
                      }
                    >
                      <ColorPickerSelection className="h-24" />
                      <div className="flex items-center gap-2">
                        <ColorPickerEyeDropper />
                        <ColorPickerHue />
                      </div>
                      <ColorPickerFormat className="[&_input]:focus-visible:border-input [&_input]:focus-visible:ring-0" />
                    </ColorPicker>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          );
        }}
      </form.Field>

      <form.Field name="kind">
        {(field) => (
          <div className="space-y-1.5">
            <TooltipPrimitive.Root>
              <TooltipPrimitive.Trigger
                delay={500}
                render={
                  <Label className="inline-flex w-fit items-center gap-1">
                    Type
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                    <HugeiconsIcon
                      className="text-muted-foreground"
                      icon={InformationCircleIcon}
                      size={13}
                    />
                  </Label>
                }
              />
              <TooltipContent>{COMPETITOR_KIND_HINT}</TooltipContent>
            </TooltipPrimitive.Root>
            <PermissionSelector
              className="w-fit overflow-visible border-0 bg-transparent"
              label="Competitor type"
            >
              <PermissionRow
                className="justify-start gap-0 p-0"
                label=""
                onValueChange={(value) =>
                  field.handleChange(
                    value === "indirect" ? "indirect" : "direct"
                  )
                }
                value={field.state.value satisfies GeoCompetitorKind}
              >
                <PermissionOption tone="success" value="direct">
                  Direct competitor
                </PermissionOption>
                <PermissionOption tone="warning" value="indirect">
                  Indirect competitor
                </PermissionOption>
              </PermissionRow>
            </PermissionSelector>
          </div>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
        )}
        <Button disabled={upsert.isPending} type="submit">
          {upsert.isPending && <Loader2Icon className="size-4 animate-spin" />}
          {competitor ? "Save changes" : "Add competitor"}
        </Button>
      </div>
    </form>
  );
}
