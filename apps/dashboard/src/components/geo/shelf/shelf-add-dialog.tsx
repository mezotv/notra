"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useForm, useStore } from "@tanstack/react-form";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Loader2Icon } from "lucide-react";
import { useId, useRef } from "react";

import { Button } from "@/components/button";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { ShelfTicketForm } from "@/components/geo/shelf/shelf-ticket-form";
import { Checkbox } from "@/components/motion/checkbox";
import {
  GEO_SHELF_PREVIEW_DEBOUNCE_MS,
  GEO_SHELF_SOURCE_KIND_LABELS,
  GEO_SHELF_SOURCE_KINDS,
} from "@/constants/geo-shelf";
import { useGeoShelfPreview } from "@/lib/hooks/use-geo-shelf";
import type {
  GeoShelfAddDialogProps,
  GeoShelfNewSourceDraft,
  GeoShelfOpportunity,
  GeoShelfSourceKind,
} from "@/types/geo-shelf";

function toKind(value: string): GeoShelfSourceKind {
  return GEO_SHELF_SOURCE_KINDS.find((kind) => kind === value) ?? "other";
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateShelfUrl(value: string): string | undefined {
  if (value.trim().length === 0 || isValidUrl(value)) {
    return undefined;
  }
  return "Enter a full URL starting with https://";
}

function toPreviewOpportunity(
  draft: GeoShelfNewSourceDraft["opportunity"]
): GeoShelfOpportunity {
  return {
    id: "draft",
    ...draft,
    createdByUserId: null,
    resolvedAt: null,
    createdAt: "",
    updatedAt: "",
  };
}

export function ShelfAddDialog({
  open,
  onOpenChange,
  organizationId,
  competitors,
  members,
  currentMemberId,
  ownBrandName,
  onSubmit,
}: GeoShelfAddDialogProps) {
  const id = useId();
  const previewTitleRef = useRef<string | null>(null);
  const form = useForm({
    defaultValues: {
      url: "",
      title: "",
      kind: "listicle",
      ownPresent: false,
      presentCompetitorIds: [],
      opportunity: {
        status: "open",
        priority: null,
        assigneeMemberId: currentMemberId,
        pocMemberId: null,
        notes: null,
        dueAt: null,
      },
    } as GeoShelfNewSourceDraft,
    onSubmit: ({ value }) => {
      const typedTitle = value.title.trim();
      onSubmit({
        ...value,
        title:
          typedTitle.length > 0 ? typedTitle : (previewTitleRef.current ?? ""),
      });
      form.reset();
      onOpenChange(false);
    },
  });

  const urlValue = useStore(form.store, (state) => state.values.url);
  const titleValue = useStore(form.store, (state) => state.values.title);
  const [debouncedUrl] = useDebouncedValue(urlValue, {
    wait: GEO_SHELF_PREVIEW_DEBOUNCE_MS,
  });
  const previewUrl =
    open && isValidUrl(debouncedUrl) ? debouncedUrl.trim() : null;
  const preview = useGeoShelfPreview(organizationId, previewUrl);
  const previewTitle = preview.data?.title ?? null;
  previewTitleRef.current = previewTitle;
  const isPreviewLoading = previewUrl !== null && preview.isFetching;
  const showPreviewTitle =
    titleValue.trim().length === 0 && previewTitle !== null;

  return (
    <ResponsiveDialog
      onOpenChange={(next) => {
        if (!next) {
          form.reset();
        }
        onOpenChange(next);
      }}
      open={open}
    >
      <ResponsiveDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-xl font-semibold">
            Add a shelf
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            A page you want {ownBrandName || "your brand"} to be listed on. Tick
            the competitors already there and hand the ticket to someone.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <form.Field
              name="url"
              validators={{
                onChange: ({ value }) => validateShelfUrl(value),
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-url`}>Page URL</Label>
                  <Input
                    autoFocus
                    id={`${id}-url`}
                    inputMode="url"
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="https://www.g2.com/categories/..."
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 ? (
                    <p className="text-destructive text-xs">
                      {String(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
            <form.Field name="kind">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-kind`}>Kind</Label>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(toKind(value ?? "other"))
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger className="w-full" id={`${id}-kind`}>
                      <SelectValue>
                        {GEO_SHELF_SOURCE_KIND_LABELS[field.state.value]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GEO_SHELF_SOURCE_KINDS.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {GEO_SHELF_SOURCE_KIND_LABELS[kind]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="title">
            {(field) => (
              <div className="space-y-1.5">
                <span className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${id}-title`}>
                    Title{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  {isPreviewLoading ? (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      <Loader2Icon className="size-3 animate-spin" />
                      Reading page title
                    </span>
                  ) : null}
                  {!isPreviewLoading &&
                  previewTitle !== null &&
                  !showPreviewTitle &&
                  field.state.value.trim() !== previewTitle ? (
                    <button
                      className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                      onClick={() => field.handleChange(previewTitle)}
                      type="button"
                    >
                      Use page title
                    </button>
                  ) : null}
                </span>
                <Input
                  id={`${id}-title`}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder={
                    previewTitle ??
                    "We'll read it from the page if you leave this empty"
                  }
                  value={showPreviewTitle ? previewTitle : field.state.value}
                />
                {showPreviewTitle ? (
                  <p className="text-muted-foreground text-xs">
                    From the page's title tag. Type to override.
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Who is already on it
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <form.Field name="ownPresent">
                {(field) => (
                  <label className="hover:bg-muted/40 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2">
                    <Checkbox
                      aria-label={`${ownBrandName || "You"} is on this page`}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                    <span className="truncate text-sm font-medium">
                      {ownBrandName || "You"}
                      <span className="text-muted-foreground ml-1 font-normal">
                        (You)
                      </span>
                    </span>
                  </label>
                )}
              </form.Field>
              <form.Field name="presentCompetitorIds">
                {(field) => (
                  <>
                    {competitors.map((competitor) => {
                      const checked = field.state.value.includes(competitor.id);
                      return (
                        <label
                          className="hover:bg-muted/40 flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2"
                          key={competitor.id}
                        >
                          <Checkbox
                            aria-label={`${competitor.name} is on this page`}
                            checked={checked}
                            onCheckedChange={(next) =>
                              field.handleChange(
                                next
                                  ? [...field.state.value, competitor.id]
                                  : field.state.value.filter(
                                      (value) => value !== competitor.id
                                    )
                              )
                            }
                          />
                          <CompetitorLogo
                            className="size-5 shrink-0 rounded-md"
                            domain={competitor.domain}
                            name={competitor.name}
                          />
                          <span className="truncate text-sm font-medium">
                            {competitor.name}
                          </span>
                        </label>
                      );
                    })}
                  </>
                )}
              </form.Field>
            </div>
            {competitors.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Add competitors in GEO settings to track who else is on this
                page.
              </p>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <p className="text-sm font-medium">Ticket</p>
            <form.Field name="opportunity">
              {(field) => (
                <ShelfTicketForm
                  currentMemberId={currentMemberId}
                  disabled={false}
                  members={members}
                  onChange={(changes) =>
                    field.handleChange({ ...field.state.value, ...changes })
                  }
                  opportunity={toPreviewOpportunity(field.state.value)}
                />
              )}
            </form.Field>
          </div>

          <ResponsiveDialogFooter className="gap-2 sm:justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.values.url, state.canSubmit] as const}
            >
              {([url, canSubmit]) => (
                <Button
                  disabled={!(canSubmit && isValidUrl(url))}
                  type="submit"
                >
                  Add shelf
                </Button>
              )}
            </form.Subscribe>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
