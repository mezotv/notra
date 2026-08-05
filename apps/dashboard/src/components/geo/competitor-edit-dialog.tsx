"use client";

import {
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerSelection,
} from "@notra/ui/components/kibo-ui/color-picker";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  PermissionOption,
  PermissionRow,
  PermissionSelector,
} from "@notra/ui/components/ui/permission-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useForm } from "@tanstack/react-form";
import Color from "color";
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { COMPETITOR_SWATCHES } from "@/constants/charts";
import { COMPETITOR_KIND_HINT } from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { useGeoCompetitorUpsert } from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type { CompetitorEditDialogProps, GeoCompetitorKind } from "@/types/geo";

export function CompetitorEditDialog({
  open,
  onOpenChange,
  organizationId,
  competitor,
}: CompetitorEditDialogProps) {
  const upsert = useGeoCompetitorUpsert(organizationId);
  const nameId = useId();
  const websiteId = useId();
  const synonymId = useId();
  const colorId = useId();
  const [synonymDraft, setSynonymDraft] = useState("");

  const form = useForm({
    defaultValues: {
      name: competitor.name,
      website: competitor.domain ?? "",
      synonyms: competitor.synonyms,
      kind: competitor.kind,
      color: competitor.color ?? "",
    },
    onSubmit: async ({ value }) => {
      await upsert.mutateAsync({
        name: value.name.trim(),
        domain: normalizeCompetitorDomain(value.website),
        synonyms: value.synonyms,
        kind: value.kind,
        color: value.color.length === 0 ? null : value.color,
      });
      onOpenChange(false);
    },
  });

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-semibold text-xl">
            Edit {competitor.name}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Name, website, and how this brand shows up in your charts.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
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
                  <CompetitorLogo
                    className="size-8 shrink-0"
                    domain={normalizeCompetitorDomain(field.state.value)}
                    name={form.state.values.name || competitor.name}
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
            {(field) => {
              const addSynonym = () => {
                const value = synonymDraft.trim();
                if (value.length === 0) {
                  return;
                }
                const exists = field.state.value.some(
                  (item) => item.toLowerCase() === value.toLowerCase()
                );
                if (!exists) {
                  field.handleChange([...field.state.value, value]);
                }
                setSynonymDraft("");
              };

              return (
                <div className="space-y-1.5">
                  <Label htmlFor={synonymId}>
                    Synonyms{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={synonymId}
                      onChange={(event) => setSynonymDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSynonym();
                        }
                      }}
                      placeholder="Other names this brand goes by"
                      value={synonymDraft}
                    />
                    <Button
                      onClick={addSynonym}
                      type="button"
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  {field.state.value.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {field.state.value.map((synonym) => (
                        <Badge
                          className="gap-1 pr-1"
                          key={synonym}
                          variant="secondary"
                        >
                          {synonym}
                          <button
                            aria-label={`Remove ${synonym}`}
                            className="rounded-sm p-0.5 hover:bg-background"
                            onClick={() =>
                              field.handleChange(
                                field.state.value.filter(
                                  (item) => item !== synonym
                                )
                              )
                            }
                            type="button"
                          >
                            <HugeiconsIcon icon={Cancel01Icon} size={12} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="color">
            {(field) => (
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
                </div>
                <ColorPicker
                  className="w-full max-w-sm rounded-lg border p-3"
                  onChange={(value) =>
                    field.handleChange(Color.rgb(value).hex())
                  }
                  value={field.state.value || COMPETITOR_SWATCHES[0]}
                >
                  <ColorPickerSelection className="h-24" />
                  <div className="flex items-center gap-2">
                    <ColorPickerEyeDropper />
                    <ColorPickerHue />
                  </div>
                  <ColorPickerFormat />
                </ColorPicker>
              </div>
            )}
          </form.Field>

          <form.Field name="kind">
            {(field) => (
              <div className="space-y-1.5">
                <TooltipProvider delay={150}>
                  <Tooltip>
                    <TooltipTrigger
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
                  </Tooltip>
                </TooltipProvider>
                <PermissionSelector
                  className="w-fit border-0 bg-transparent"
                  label="Competitor type"
                >
                  <PermissionRow
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
                    <PermissionOption tone="neutral" value="indirect">
                      Indirect competitor
                    </PermissionOption>
                  </PermissionRow>
                </PermissionSelector>
              </div>
            )}
          </form.Field>

          <ResponsiveDialogFooter>
            <Button disabled={upsert.isPending} type="submit">
              {upsert.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Save changes
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
