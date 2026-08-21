"use client";

import { InformationCircleIcon } from "@hugeicons/core-free-icons";
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
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { GEO_ENGINE_SET, GEO_ZDR_FEATURE_LABEL } from "@/constants/geo";
import {
  GEO_MODEL_PROVIDERS,
  geoModelsForProvider,
} from "@/constants/geo-model-catalog";
import { cn } from "@/lib/utils";
import type {
  GeoEnginePickerProps,
  GeoModelCatalogEntry,
  GeoModelProvider,
} from "@/types/geo";
import {
  applyGeoZdrEngineFallback,
  enginesForProviderToggle,
  sortKnownEngines,
} from "@/utils/geo-engines";

const ROW_CLASS = "flex items-center justify-between gap-3 px-3 py-2";

/**
 * True when the selection is exactly what the provider switches would
 * produce; otherwise the user picked individual models and needs Advanced.
 */
function isProviderLevelSelection(selected: readonly string[]): boolean {
  const selectedSet = new Set(selected);
  const expected = new Set<string>();
  for (const provider of GEO_MODEL_PROVIDERS) {
    const models = geoModelsForProvider(provider.id);
    if (models.some((model) => selectedSet.has(model.id))) {
      for (const id of enginesForProviderToggle(provider.id, false)) {
        expected.add(id);
      }
    }
  }
  const chosen = new Set(selected.filter((id) => GEO_ENGINE_SET.has(id)));
  if (chosen.size !== expected.size) {
    return false;
  }
  for (const id of chosen) {
    if (!expected.has(id)) {
      return false;
    }
  }
  return true;
}

export function GeoEnginePicker({
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
  const [advanced, setAdvanced] = useState(
    () => !isProviderLevelSelection(selected)
  );
  const [showMore, setShowMore] = useState(() =>
    GEO_MODEL_PROVIDERS.some(
      (provider) =>
        !provider.featured &&
        geoModelsForProvider(provider.id).some((model) =>
          selected.includes(model.id)
        )
    )
  );
  const [pendingApproval, setPendingApproval] =
    useState<GeoModelCatalogEntry | null>(null);

  const lastSelected = selected.length <= 1;
  const zdrActive = enforceZdr && canEnforceZdr;

  const select = (ids: readonly string[]) => {
    onChange(sortKnownEngines([...selected, ...ids]));
  };
  const deselect = (ids: readonly string[]) => {
    const remove = new Set(ids);
    onChange(selected.filter((engine) => !remove.has(engine)));
    onNonZdrApprovedChange(
      nonZdrApproved.filter((engine) => !remove.has(engine))
    );
  };

  const toggleProvider = (provider: GeoModelProvider, checked: boolean) => {
    const models = geoModelsForProvider(provider.id);
    if (!checked) {
      deselect(models.map((model) => model.id));
      return;
    }
    const ids = enginesForProviderToggle(provider.id, zdrActive);
    if (ids.length > 0) {
      select(ids);
      return;
    }
    const first = models[0];
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
      sortKnownEngines([...nonZdrApproved, pendingApproval.id])
    );
    select([pendingApproval.id]);
    setPendingApproval(null);
  };

  const handleZdrChange = (next: boolean) => {
    onEnforceZdrChange(next);
    if (next) {
      onChange(
        applyGeoZdrEngineFallback(selected, {
          enforceZdr: true,
          nonZdrApprovedEngines: nonZdrApproved,
        })
      );
    }
  };

  const visibleProviders = GEO_MODEL_PROVIDERS.filter(
    (provider) => provider.featured || showMore
  );
  const hiddenCount = GEO_MODEL_PROVIDERS.length - visibleProviders.length;
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
          const models = geoModelsForProvider(provider.id);
          const selectedModels = models.filter((model) =>
            selected.includes(model.id)
          );
          const providerOn = selectedModels.length > 0;
          const providerLocked =
            providerOn && selectedModels.length === selected.length;
          const switchId = `${id}-${provider.id}`;
          let subtitle = provider.hint;
          if (advanced) {
            subtitle =
              selectedModels.length > 0
                ? selectedModels.map((model) => model.label).join(", ")
                : "No models selected";
          }
          return (
            <li
              className="border-border/60 border-b last:border-b-0"
              key={provider.id}
            >
              <div className={ROW_CLASS}>
                <Label
                  className="flex min-w-0 flex-1 items-center gap-2.5 font-normal"
                  htmlFor={switchId}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center overflow-visible">
                    <EngineIcon
                      className="size-4 overflow-visible"
                      engine={models[0]?.id ?? provider.id}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block">{provider.label}</span>
                    <span className="block text-pretty text-[11px] text-muted-foreground leading-snug">
                      {subtitle}
                    </span>
                  </span>
                </Label>
                <Switch
                  checked={providerOn}
                  disabled={disabled || providerLocked}
                  id={switchId}
                  onCheckedChange={(next) => toggleProvider(provider, next)}
                />
              </div>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  advanced ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <ul
                  className="min-h-0 overflow-hidden bg-muted/25"
                  inert={advanced ? undefined : true}
                >
                  {models.map((model) => {
                    const checked = selected.includes(model.id);
                    const modelId = `${id}-${model.id}`;
                    const approved = nonZdrApproved.includes(model.id);
                    const noZdr = model.zdr === "none";
                    return (
                      <li
                        className="flex items-center justify-between gap-3 py-2 ps-12 pe-3"
                        key={model.id}
                      >
                        <Label
                          className="flex min-w-0 flex-1 items-center gap-2 font-normal"
                          htmlFor={modelId}
                        >
                          <span className="min-w-0 text-sm">{model.label}</span>
                          {noZdr ? (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {approved
                                ? "Approved without ZDR"
                                : "No ZDR host"}
                            </span>
                          ) : null}
                        </Label>
                        <Switch
                          checked={checked}
                          disabled={disabled || (checked && lastSelected)}
                          id={modelId}
                          onCheckedChange={(next) => toggleModel(model, next)}
                          size="sm"
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
        {hiddenCount > 0 ? (
          <li className="px-3 py-2">
            <button
              className="text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
              disabled={disabled}
              onClick={() => setShowMore(true)}
              type="button"
            >
              Show {hiddenCount} more providers
            </button>
          </li>
        ) : null}
      </ul>

      <div className="divide-y rounded-lg ring-1 ring-foreground/10">
        <div className={`${ROW_CLASS} py-2.5`}>
          <div className="space-y-0.5">
            <Label htmlFor={`${id}-advanced`}>Advanced</Label>
            <p className="text-muted-foreground text-xs">
              Pick individual models per provider.
            </p>
          </div>
          <Switch
            checked={advanced}
            disabled={disabled}
            id={`${id}-advanced`}
            onCheckedChange={setAdvanced}
          />
        </div>
        <div className={`${ROW_CLASS} py-2.5`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`${id}-zdr`}>Enforce ZDR</Label>
              <Tooltip>
                <TooltipTrigger
                  aria-label={`About ${GEO_ZDR_FEATURE_LABEL}`}
                  className="cursor-help text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3.5"
                    icon={InformationCircleIcon}
                    strokeWidth={2}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="top">
                  {GEO_ZDR_FEATURE_LABEL}: prompts are not stored by the model
                  host. Providers without a ZDR host fall back to a sibling
                  model, or stay off until you approve them.
                </TooltipContent>
              </Tooltip>
              {canEnforceZdr ? null : (
                <Badge className="h-4 px-1.5 text-[10px]" variant="outline">
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
