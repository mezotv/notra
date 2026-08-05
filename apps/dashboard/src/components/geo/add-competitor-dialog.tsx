"use client";

import {
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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
import { Loader2Icon } from "lucide-react";
import { useId, useState } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { COMPETITOR_KIND_HINT } from "@/constants/geo";
import { normalizeCompetitorDomain } from "@/lib/geo/domain";
import { useGeoCompetitorUpsert } from "@/lib/hooks/use-geo";
import type {
  AddCompetitorDialogProps,
  AddCompetitorFormValues,
  GeoCompetitorKind,
} from "@/types/geo";

const DEFAULT_VALUES: AddCompetitorFormValues = {
  name: "",
  website: "",
  synonyms: [],
  kind: "direct",
};

export function AddCompetitorDialog({
  open,
  onOpenChange,
  organizationId,
}: AddCompetitorDialogProps) {
  const upsert = useGeoCompetitorUpsert(organizationId);
  const nameId = useId();
  const websiteId = useId();
  const synonymsId = useId();
  const [synonymDraft, setSynonymDraft] = useState("");

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      await upsert.mutateAsync({
        name: value.name.trim(),
        domain: normalizeCompetitorDomain(value.website),
        synonyms: value.synonyms,
        kind: value.kind,
      });
      form.reset();
      onOpenChange(false);
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
    }
    onOpenChange(next);
  };

  return (
    <ResponsiveDialog onOpenChange={handleOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="font-semibold text-xl">
            Add competitor
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Named competitors get called out in scans. Synonyms count as
            mentions too.
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
                  autoFocus
                  id={nameId}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Typefully"
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
                    name={form.state.values.name || "?"}
                  />
                  <Input
                    id={websiteId}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="typefully.com"
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
                  <Label htmlFor={synonymsId}>
                    Synonyms{" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={synonymsId}
                      onChange={(event) => setSynonymDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSynonym();
                        }
                      }}
                      placeholder="Notra, Inc."
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
                  <p className="text-muted-foreground text-xs">
                    Press Enter to add each name. Mentions of these count for
                    this competitor.
                  </p>
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
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  disabled={
                    !canSubmit ||
                    isSubmitting ||
                    form.state.values.name.trim().length === 0
                  }
                  type="submit"
                >
                  {(isSubmitting || upsert.isPending) && (
                    <Loader2Icon className="size-4 animate-spin" />
                  )}
                  Add competitor
                </Button>
              )}
            </form.Subscribe>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
