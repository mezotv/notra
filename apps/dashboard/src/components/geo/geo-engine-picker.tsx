"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@notra/ui/components/ui/alert-dialog";
import { Badge } from "@notra/ui/components/ui/badge";
import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import Link from "next/link";
import { useId, useState } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { Checkbox } from "@/components/motion/checkbox";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GEO_PICKER_VISIBLE_MODELS } from "@/constants/geo-model-catalog";
import { cn } from "@/lib/utils";
import type {
  GeoEnginePickerProps,
  GeoModelCatalog,
  GeoModelCatalogEntry,
} from "@/types/geo";
import {
  applyGeoZdrEngineFallback,
  sortKnownEngines,
} from "@/utils/geo-engines";
import { geoModelsForProvider } from "@/utils/geo-model-catalog";

const ROW_CLASS = "flex items-center justify-between gap-3 px-3 py-2";

function partiallySelectedProviders(
  catalog: GeoModelCatalog,
  selected: readonly string[]
): Set<string> {
  const expanded = new Set<string>();
  for (const provider of catalog.providers) {
    const models = geoModelsForProvider(catalog, provider.id);
    const count = models.filter((model) => selected.includes(model.id)).length;
    if (count > 0 && count < models.length) {
      expanded.add(provider.id);
    }
  }
  return expanded;
}

export function GeoEnginePicker({
  catalog,
  selected,
  onChange,
  enforceZdr,
  onEnforceZdrChange,
  nonZdrApproved,
  onNonZdrApprovedChange,
  canEnforceZdr,
  planLoading = false,
  disabled = false,
  labeled = true,
}: GeoEnginePickerProps) {
  const id = useId();
  const { activeOrganization } = useOrganizationsContext();
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    partiallySelectedProviders(catalog, selected)
  );
  const [showMore, setShowMore] = useState(() =>
    catalog.providers.some(
      (provider) =>
        !provider.featured &&
        geoModelsForProvider(catalog, provider.id).some((model) =>
          selected.includes(model.id)
        )
    )
  );
  const [pendingApproval, setPendingApproval] =
    useState<GeoModelCatalogEntry | null>(null);
  const [showAllModels, setShowAllModels] = useState<Set<string>>(
    () => new Set()
  );

  const lastSelected = selected.length <= 1;
  const zdrActive = enforceZdr && canEnforceZdr;

  const select = (ids: readonly string[]) => {
    onChange(sortKnownEngines(catalog, [...selected, ...ids]));
  };
  const deselect = (ids: readonly string[]) => {
    const remove = new Set(ids);
    onChange(selected.filter((engine) => !remove.has(engine)));
    onNonZdrApprovedChange(
      nonZdrApproved.filter((engine) => !remove.has(engine))
    );
  };

  const toggleExpanded = (providerId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const toggleShowAllModels = (providerId: string) => {
    setShowAllModels((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const toggleProvider = (
    models: readonly GeoModelCatalogEntry[],
    visibleModels: readonly GeoModelCatalogEntry[],
    checked: boolean
  ) => {
    if (!checked) {
      deselect(models.map((model) => model.id));
      return;
    }
    const eligible = zdrActive
      ? visibleModels.filter(
          (model) => model.zdr !== "none" || nonZdrApproved.includes(model.id)
        )
      : visibleModels;
    if (eligible.length > 0) {
      select(eligible.map((model) => model.id));
      return;
    }
    const first = visibleModels[0];
    if (first) {
      setPendingApproval(first);
    }
  };

  const toggleModel = (model: GeoModelCatalogEntry, checked: boolean) => {
    if (!checked) {
      deselect([model.id]);
      return;
    }
    const needsApproval =
      zdrActive && model.zdr === "none" && !nonZdrApproved.includes(model.id);
    if (needsApproval) {
      setPendingApproval(model);
      return;
    }
    select([model.id]);
  };

  const approvePending = () => {
    if (!pendingApproval) {
      return;
    }
    onNonZdrApprovedChange(
      sortKnownEngines(catalog, [...nonZdrApproved, pendingApproval.id])
    );
    select([pendingApproval.id]);
    setPendingApproval(null);
  };

  const handleZdrChange = (next: boolean) => {
    onEnforceZdrChange(next);
    if (next) {
      onChange(
        applyGeoZdrEngineFallback(catalog, selected, {
          enforceZdr: true,
          nonZdrApprovedEngines: nonZdrApproved,
        })
      );
    }
  };

  const visibleProviders = catalog.providers.filter(
    (provider) => provider.featured || showMore
  );
  const hiddenCount = catalog.providers.length - visibleProviders.length;
  const billingHref = activeOrganization
    ? `/${activeOrganization.slug}/settings/billing`
    : null;

  return (
    <div className="space-y-3">
      {labeled ? (
        <div className="space-y-1">
          <p className="font-medium text-sm">Models</p>
          <p className="text-muted-foreground text-xs">
            Every prompt runs against each enabled model. Turn off the ones you
            do not need to keep scans lean.
          </p>
        </div>
      ) : null}

      <ul className="overflow-hidden rounded-md border">
        {visibleProviders.map((provider) => {
          const models = geoModelsForProvider(catalog, provider.id);
          const isExpanded = expanded.has(provider.id);
          const allModelsShown = showAllModels.has(provider.id);
          const visibleModels = allModelsShown
            ? models
            : models.slice(0, GEO_PICKER_VISIBLE_MODELS);
          const selectedVisible = visibleModels.filter((model) =>
            selected.includes(model.id)
          );
          const someOn = models.some((model) => selected.includes(model.id));
          const allOn =
            visibleModels.length > 0 &&
            selectedVisible.length === visibleModels.length;
          const selectedCount = models.filter((model) =>
            selected.includes(model.id)
          ).length;
          const providerLocked = allOn && selectedCount === selected.length;
          const hiddenModelCount = models.length - visibleModels.length;
          const checkboxId = `${id}-${provider.id}`;
          return (
            <li
              className="relative border-border/60 border-b last:border-b-0"
              key={provider.id}
            >
              <div className={cn(ROW_CLASS, "bg-muted")}>
                <button
                  aria-expanded={isExpanded}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
                  disabled={disabled}
                  onClick={() => toggleExpanded(provider.id)}
                  type="button"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center overflow-visible">
                    <EngineIcon
                      className="size-4 overflow-visible"
                      engine={models[0]?.id ?? provider.id}
                    />
                  </span>
                  <span className="truncate font-medium">{provider.label}</span>
                  <HugeiconsIcon
                    className={cn(
                      "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                    icon={ArrowDown01Icon}
                  />
                </button>
                <Checkbox
                  aria-label={`Toggle all ${provider.label} models`}
                  checked={allOn}
                  disabled={disabled || providerLocked}
                  id={checkboxId}
                  indeterminate={someOn && !allOn}
                  onCheckedChange={(next) =>
                    toggleProvider(models, visibleModels, next)
                  }
                />
              </div>
              <div
                className={cn(
                  "grid bg-muted transition-[grid-template-rows] duration-200 ease-out",
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div
                  className="min-h-0 overflow-hidden"
                  inert={isExpanded ? undefined : true}
                >
                  <div className="relative mx-2 mb-2 rounded-lg bg-background py-1">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-2 bottom-2 left-[1.25rem] w-px bg-border"
                    />
                    <ul>
                      {visibleModels.map((model) => {
                        const checked = selected.includes(model.id);
                        const modelId = `${id}-${model.id}`;
                        const approved = nonZdrApproved.includes(model.id);
                        const noZdr = model.zdr === "none";
                        return (
                          <li
                            className="flex items-center justify-between gap-3 py-1.5 ps-10 pe-1"
                            key={model.id}
                          >
                            <Label
                              className="flex min-w-0 flex-1 items-center gap-2 font-normal"
                              htmlFor={modelId}
                            >
                              <span className="min-w-0 text-xs">
                                {model.label}
                              </span>
                              {noZdr ? (
                                <span className="shrink-0 text-muted-foreground text-xs">
                                  {approved
                                    ? "Approved without ZDR"
                                    : "No ZDR host"}
                                </span>
                              ) : null}
                            </Label>
                            <Checkbox
                              aria-label={`Toggle ${model.label}`}
                              checked={checked}
                              disabled={disabled || (checked && lastSelected)}
                              id={modelId}
                              onCheckedChange={(next) =>
                                toggleModel(model, next)
                              }
                            />
                          </li>
                        );
                      })}
                      {hiddenModelCount > 0 || allModelsShown ? (
                        <li className="py-1.5 ps-10 pe-1">
                          <button
                            className="cursor-pointer text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed"
                            disabled={disabled}
                            onClick={() => toggleShowAllModels(provider.id)}
                            type="button"
                          >
                            {allModelsShown
                              ? "Show fewer models"
                              : `Show ${hiddenModelCount} other ${hiddenModelCount === 1 ? "model" : "models"}`}
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {hiddenCount > 0 ? (
          <li className="bg-muted p-2">
            <div className="rounded-lg bg-background px-3 py-1.5">
              <button
                className="cursor-pointer text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline disabled:cursor-not-allowed"
                disabled={disabled}
                onClick={() => setShowMore(true)}
                type="button"
              >
                Show {hiddenCount} more providers
              </button>
            </div>
          </li>
        ) : null}
      </ul>

      <div className="divide-y rounded-lg ring-1 ring-foreground/10">
        <div className={`${ROW_CLASS} py-2.5`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`${id}-zdr`}>Enforce ZDR</Label>
              {canEnforceZdr ? null : (
                <Badge className="h-4 px-1.5 text-[0.625rem]" variant="outline">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {canEnforceZdr ? (
                "Only run models on zero-data-retention hosts."
              ) : (
                <>
                  Zero data retention is included in Pro.{" "}
                  {billingHref ? (
                    <Link
                      className="text-foreground underline underline-offset-4"
                      href={billingHref}
                    >
                      Upgrade to Pro
                    </Link>
                  ) : null}
                </>
              )}
            </p>
          </div>
          {canEnforceZdr ? (
            <Switch
              checked={enforceZdr}
              disabled={disabled || planLoading}
              id={`${id}-zdr`}
              onCheckedChange={handleZdrChange}
            />
          ) : (
            <Tooltip>
              <TooltipTrigger
                aria-disabled="true"
                className="inline-flex cursor-not-allowed"
                type="button"
              >
                <Switch
                  aria-hidden="true"
                  checked={false}
                  disabled
                  id={`${id}-zdr`}
                  tabIndex={-1}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {planLoading
                  ? "Checking your plan…"
                  : "Upgrade to Pro to enforce zero data retention."}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingApproval(null);
          }
        }}
        open={pendingApproval !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingApproval?.label} has no zero-data-retention host
            </AlertDialogTitle>
            <AlertDialogDescription>
              Prompts sent to this model may be stored by the provider even
              though ZDR is enforced for this project. Enable it anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={approvePending}>
              Enable without ZDR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
