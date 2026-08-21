"use client";

import {
  ArrowDown01Icon,
  InformationCircleIcon,
  SearchIcon,
} from "@hugeicons/core-free-icons";
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
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { Input } from "@notra/ui/components/ui/input";
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
import { GEO_DEFAULT_ENGINES, GEO_ZDR_FEATURE_LABEL } from "@/constants/geo";
import {
  GEO_MODEL_CATALOG,
  GEO_MODEL_PROVIDERS,
  geoModelsForProvider,
  getGeoModelCatalogEntry,
} from "@/constants/geo-model-catalog";
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
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    () => new Set()
  );
  const [search, setSearch] = useState("");
  const [pendingApproval, setPendingApproval] =
    useState<GeoModelCatalogEntry | null>(null);

  const lastSelected = selected.length <= 1;
  const zdrActive = enforceZdr && canEnforceZdr;
  const selectedSet = new Set(selected);
  const approvedSet = new Set(nonZdrApproved);

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

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleProviders = GEO_MODEL_PROVIDERS.filter((provider) => {
    if (!normalizedSearch) {
      return true;
    }
    return (
      provider.label.toLocaleLowerCase().includes(normalizedSearch) ||
      geoModelsForProvider(provider.id).some((model) =>
        model.label.toLocaleLowerCase().includes(normalizedSearch)
      )
    );
  });
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

      <div className="overflow-hidden rounded-lg border">
        <div className="flex flex-col gap-2 border-border/60 border-b p-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <HugeiconsIcon
              aria-hidden="true"
              className="-translate-y-1/2 absolute top-1/2 left-2.5 text-muted-foreground"
              icon={SearchIcon}
              size={15}
            />
            <Input
              aria-label="Search model makers and models"
              className="pl-8"
              disabled={disabled}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search models"
              type="search"
              value={search}
            />
          </div>
          <Button
            disabled={disabled}
            onClick={() => {
              const selectable: string[] = [];
              for (const model of GEO_MODEL_CATALOG) {
                if (
                  !zdrActive ||
                  model.zdr !== "none" ||
                  approvedSet.has(model.id)
                ) {
                  selectable.push(model.id);
                }
              }
              onChange(sortKnownEngines(selectable));
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Select all
          </Button>
          <Button
            disabled={disabled}
            onClick={() => {
              const defaults = zdrActive
                ? GEO_DEFAULT_ENGINES.filter(
                    (engine) => getGeoModelCatalogEntry(engine)?.zdr !== "none"
                  )
                : GEO_DEFAULT_ENGINES;
              const defaultSet = new Set<string>(defaults);
              onChange(sortKnownEngines(defaults));
              onNonZdrApprovedChange(
                nonZdrApproved.filter((engine) => defaultSet.has(engine))
              );
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Use defaults
          </Button>
        </div>
        <ul>
          {visibleProviders.map((provider) => {
            const models = geoModelsForProvider(provider.id);
            const providerMatches = provider.label
              .toLocaleLowerCase()
              .includes(normalizedSearch);
            const visibleModels =
              normalizedSearch && !providerMatches
                ? models.filter((model) =>
                    model.label.toLocaleLowerCase().includes(normalizedSearch)
                  )
                : models;
            const selectedModels = models.filter((model) =>
              selectedSet.has(model.id)
            );
            const providerOn = selectedModels.length > 0;
            const providerLocked =
              providerOn && selectedModels.length === selected.length;
            const isOpen =
              normalizedSearch.length > 0 || expandedProviders.has(provider.id);
            return (
              <Collapsible
                key={provider.id}
                onOpenChange={(open) => {
                  setExpandedProviders((current) => {
                    const next = new Set(current);
                    if (open) {
                      next.add(provider.id);
                    } else {
                      next.delete(provider.id);
                    }
                    return next;
                  });
                }}
                open={isOpen}
                render={
                  <li className="border-border/60 border-b last:border-b-0" />
                }
              >
                <div className={ROW_CLASS}>
                  <CollapsibleTrigger
                    className="group flex min-h-8 min-w-0 flex-1 items-center gap-2.5 rounded-md text-start outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    disabled={disabled}
                  >
                    <HugeiconsIcon
                      aria-hidden="true"
                      className="-rotate-90 size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-aria-expanded:rotate-0"
                      icon={ArrowDown01Icon}
                      strokeWidth={2}
                    />
                    <span className="flex size-8 shrink-0 items-center justify-center overflow-visible">
                      <EngineIcon
                        className="size-4 overflow-visible"
                        engine={models[0]?.id ?? provider.id}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-sm">
                        {provider.label}
                      </span>
                      {selectedModels.length > 0 ? (
                        <span className="block text-pretty text-[11px] text-muted-foreground leading-snug">
                          {selectedModels
                            .map((model) => model.label)
                            .join(", ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                      {selectedModels.length}/{models.length}
                    </span>
                  </CollapsibleTrigger>
                  <Switch
                    aria-label={`Enable ${provider.label} models`}
                    checked={providerOn}
                    disabled={disabled || providerLocked}
                    onCheckedChange={(next) => toggleProvider(provider, next)}
                  />
                </div>
                <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                  <ul className="border-border/60 border-t bg-muted/25">
                    {visibleModels.map((model) => {
                      const checked = selectedSet.has(model.id);
                      const modelId = `${id}-${model.id}`;
                      const approved = approvedSet.has(model.id);
                      const noZdr = model.zdr === "none";
                      return (
                        <li
                          className="flex min-h-10 items-center justify-between gap-3 border-border/40 border-b py-2 ps-[4.375rem] pe-3 last:border-b-0"
                          key={model.id}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <Label
                              className="min-w-0 font-normal text-sm"
                              htmlFor={modelId}
                            >
                              {model.label}
                            </Label>
                            {noZdr ? (
                              <Tooltip>
                                <TooltipTrigger
                                  aria-label={`${model.label} zero-data-retention information`}
                                  className="shrink-0 cursor-help text-muted-foreground hover:text-foreground"
                                  type="button"
                                >
                                  <HugeiconsIcon
                                    aria-hidden="true"
                                    className="size-3.5"
                                    icon={InformationCircleIcon}
                                    strokeWidth={2}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  {approved
                                    ? "Approved to run without zero data retention."
                                    : "No zero-data-retention host is available for this model."}
                                </TooltipContent>
                              </Tooltip>
                            ) : null}
                          </div>
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
                </CollapsibleContent>
              </Collapsible>
            );
          })}
          {visibleProviders.length === 0 ? (
            <li className="px-3 py-8 text-center text-muted-foreground text-sm">
              No model makers or models match “{search.trim()}”.
            </li>
          ) : null}
        </ul>
      </div>

      <div className="divide-y rounded-lg ring-1 ring-foreground/10">
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
