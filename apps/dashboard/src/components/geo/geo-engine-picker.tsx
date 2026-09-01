"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { GEO_PICKER_VISIBLE_MODELS } from "@notra/geo-core/constants/geo-model-catalog";
import type {
  GeoModelCatalog,
  GeoModelCatalogEntry,
} from "@notra/geo-core/types/geo";
import {
  applyGeoZdrEngineFallback,
  sortKnownEngines,
} from "@notra/geo-core/utils/geo-engines";
import { geoModelsForProvider } from "@notra/geo-core/utils/geo-model-catalog";
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
import { useCustomer } from "autumn-js/react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { ZdrConsentDialog } from "@/components/billing/zdr-consent-dialog";
import { EngineIcon } from "@/components/geo/engine-icon";
import {
  hasProviderWordmark,
  ProviderWordmark,
} from "@/components/geo/provider-wordmark";
import { Checkbox } from "@/components/motion/checkbox";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  ZDR_ADDON_ADD_SUCCESS,
  ZDR_ADDON_ANCHOR,
  ZDR_CHECKOUT_SUCCESS_PARAM,
} from "@/constants/billing";
import { cn } from "@/lib/utils";
import type { GeoEnginePickerProps } from "@/types/geo";
import {
  findActivePlanSubscription,
  zdrAddonPlanId,
} from "@/utils/billing-plans";

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

function GeoModelRow({
  approved,
  checked,
  disabled,
  id,
  model,
  onCheckedChange,
  revealIndex,
  revealTotal,
  revealed,
  showZdrState,
}: {
  approved: boolean;
  checked: boolean;
  disabled: boolean;
  id: string;
  model: GeoModelCatalogEntry;
  onCheckedChange: (checked: boolean) => void;
  revealIndex?: number;
  revealTotal?: number;
  revealed?: boolean;
  showZdrState: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const hasRevealAnimation = revealed !== undefined;
  const staggerDelay = revealed
    ? (revealIndex ?? 0) * 0.045
    : ((revealTotal ?? 1) - (revealIndex ?? 0) - 1) * 0.035;
  const revealAnimation = revealed
    ? { filter: "blur(0px)", opacity: 1, y: 0 }
    : { filter: "blur(5px)", opacity: 0, y: -5 };

  return (
    <motion.li
      animate={hasRevealAnimation ? revealAnimation : undefined}
      className="flex items-center justify-between gap-3 py-1.5 ps-10 pe-3"
      initial={false}
      layout={reduceMotion ? false : "position"}
      layoutId={reduceMotion ? undefined : `geo-model-${id}`}
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              delay: hasRevealAnimation ? staggerDelay : 0,
              filter: { duration: 0.18 },
              layout: {
                duration: 0.24,
                ease: [0.77, 0, 0.175, 1],
              },
              opacity: { duration: 0.16 },
              y: {
                duration: 0.2,
                ease: [0.23, 1, 0.32, 1],
              },
            }
      }
    >
      <Label
        className="flex min-w-0 flex-1 items-center gap-2 font-normal"
        htmlFor={id}
      >
        <span className="min-w-0 text-xs">{model.label}</span>
        {showZdrState && model.zdr === "none" ? (
          <span className="text-muted-foreground shrink-0 text-xs">
            {approved ? "Approved without ZDR" : "No ZDR host"}
          </span>
        ) : null}
      </Label>
      <Checkbox
        aria-label={`Toggle ${model.label}`}
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={onCheckedChange}
      />
    </motion.li>
  );
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
  const reduceMotion = useReducedMotion();
  const { activeOrganization } = useOrganizationsContext();
  const { attach, data: customer, refetch } = useCustomer();
  const [addonLoading, setAddonLoading] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const checkoutReturnHandled = useRef(false);
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

  const handleZdrChange = useCallback(
    (next: boolean) => {
      onEnforceZdrChange(next);
      if (next) {
        onChange(
          applyGeoZdrEngineFallback(catalog, selected, {
            enforceZdr: true,
            nonZdrApprovedEngines: nonZdrApproved,
          })
        );
      }
    },
    [catalog, nonZdrApproved, onChange, onEnforceZdrChange, selected]
  );

  useEffect(() => {
    if (checkoutReturnHandled.current || !canEnforceZdr) {
      return;
    }

    const returnUrl = new URL(window.location.href);
    if (returnUrl.searchParams.get(ZDR_CHECKOUT_SUCCESS_PARAM) !== "true") {
      return;
    }

    checkoutReturnHandled.current = true;
    handleZdrChange(true);
    returnUrl.searchParams.delete(ZDR_CHECKOUT_SUCCESS_PARAM);
    window.history.replaceState(null, "", returnUrl);
  }, [canEnforceZdr, handleZdrChange]);

  const handleAddZdr = async () => {
    const activeSubscription = findActivePlanSubscription(
      customer?.subscriptions
    );
    const addonPlanId = zdrAddonPlanId(activeSubscription?.planId);
    if (!addonPlanId) {
      toast.error("Choose a plan before adding zero data retention.");
      return;
    }

    setAddonLoading(true);
    const successUrl = activeOrganization?.slug
      ? new URL(window.location.href)
      : undefined;
    successUrl?.searchParams.set(ZDR_CHECKOUT_SUCCESS_PARAM, "true");
    try {
      const result = await attach({
        planId: addonPlanId,
        redirectMode: "if_required",
        successUrl: successUrl?.toString(),
      });
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      await refetch();
      handleZdrChange(true);
      toast.success(ZDR_ADDON_ADD_SUCCESS);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not add zero data retention. Please try again."
      );
    }
    setAddonLoading(false);
  };

  const hiddenProviders = catalog.providers.filter(
    (provider) => !provider.featured
  );
  const hiddenProviderIndex = new Map(
    hiddenProviders.map((provider, index) => [provider.id, index])
  );
  const hiddenCount = hiddenProviders.length;
  const billingHref = activeOrganization
    ? `/${activeOrganization.slug}/settings/billing#${ZDR_ADDON_ANCHOR}`
    : null;

  return (
    <div className="space-y-3">
      {labeled ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">Models</p>
          <p className="text-muted-foreground text-xs">
            Every prompt runs against each enabled model. Turn off the ones you
            do not need to keep scans lean.
          </p>
        </div>
      ) : null}

      <ul className="bg-card overflow-hidden rounded-xl border">
        {catalog.providers.map((provider) => {
          const isVisible = provider.featured || showMore;
          const revealIndex = hiddenProviderIndex.get(provider.id) ?? 0;
          const staggerDelay = showMore
            ? revealIndex * 0.045
            : (hiddenCount - revealIndex - 1) * 0.035;
          const models = geoModelsForProvider(catalog, provider.id);
          const isExpanded = expanded.has(provider.id);
          const allModelsShown = showAllModels.has(provider.id);
          const selectedModels = models.filter((model) =>
            selected.includes(model.id)
          );
          const orderedModels = [
            ...selectedModels,
            ...models.filter((model) => !selected.includes(model.id)),
          ];
          const primaryModelCount = Math.max(
            GEO_PICKER_VISIBLE_MODELS,
            selectedModels.length
          );
          const primaryModels = orderedModels.slice(0, primaryModelCount);
          const additionalModels = orderedModels.slice(primaryModelCount);
          const visibleModels = allModelsShown ? orderedModels : primaryModels;
          const selectedVisible = visibleModels.filter((model) =>
            selected.includes(model.id)
          );
          const someOn = selectedModels.length > 0;
          const allOn =
            visibleModels.length > 0 &&
            selectedVisible.length === visibleModels.length;
          const selectedCount = selectedModels.length;
          const providerLocked = allOn && selectedCount === selected.length;
          const checkboxId = `${id}-${provider.id}`;
          return (
            <motion.li
              animate={
                isVisible
                  ? {
                      filter: "blur(0px)",
                      height: "auto",
                      opacity: 1,
                      y: 0,
                    }
                  : {
                      filter: "blur(5px)",
                      height: 0,
                      opacity: 0,
                      y: -5,
                    }
              }
              aria-hidden={!isVisible}
              className="border-border/60 relative overflow-hidden border-b last:border-b-0"
              inert={isVisible ? undefined : true}
              initial={false}
              key={provider.id}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      delay: provider.featured ? 0 : staggerDelay,
                      filter: { duration: 0.18 },
                      height: {
                        duration: 0.24,
                        ease: [0.23, 1, 0.32, 1],
                      },
                      opacity: { duration: 0.16 },
                      y: {
                        duration: 0.2,
                        ease: [0.23, 1, 0.32, 1],
                      },
                    }
              }
            >
              <div
                className={cn(
                  ROW_CLASS,
                  "bg-card hover:bg-muted/40 ps-4 pe-6 transition-colors"
                )}
              >
                <button
                  aria-expanded={isExpanded}
                  className="focus-visible:ring-ring flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed"
                  disabled={disabled}
                  onClick={() => toggleExpanded(provider.id)}
                  type="button"
                >
                  {hasProviderWordmark(provider.id) ? (
                    <ProviderWordmark
                      className="h-2.5 w-auto"
                      label={provider.label}
                      provider={provider.id}
                    />
                  ) : (
                    <>
                      <span className="flex size-7 shrink-0 items-center justify-center overflow-visible">
                        <EngineIcon
                          className="size-4 overflow-visible"
                          engine={models[0]?.id ?? provider.id}
                        />
                      </span>
                      <span className="truncate font-medium">
                        {provider.label}
                      </span>
                    </>
                  )}
                  <HugeiconsIcon
                    className={cn(
                      "text-muted-foreground size-3.5 shrink-0 transition-transform duration-200",
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
                  "bg-muted/20 dark:bg-muted/15 grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div
                  className="min-h-0 overflow-hidden"
                  inert={isExpanded ? undefined : true}
                >
                  <div className="border-border/60 bg-background/70 dark:bg-background/45 relative mx-3 mb-3 rounded-lg border py-1">
                    <span
                      aria-hidden
                      className="bg-border pointer-events-none absolute top-2 bottom-2 left-[1.25rem] w-px"
                    />
                    <ul>
                      {primaryModels.map((model) => {
                        const checked = selected.includes(model.id);
                        const modelId = `${id}-${model.id}`;
                        return (
                          <GeoModelRow
                            approved={nonZdrApproved.includes(model.id)}
                            checked={checked}
                            disabled={disabled || (checked && lastSelected)}
                            id={modelId}
                            key={model.id}
                            model={model}
                            onCheckedChange={(next) => toggleModel(model, next)}
                            showZdrState={zdrActive}
                          />
                        );
                      })}
                      {additionalModels.length > 0 ? (
                        <li
                          aria-hidden={!allModelsShown}
                          className={cn(
                            "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                            allModelsShown
                              ? "grid-rows-[1fr]"
                              : "grid-rows-[0fr]"
                          )}
                        >
                          <div
                            className="min-h-0 overflow-hidden"
                            inert={allModelsShown ? undefined : true}
                          >
                            <ul>
                              {additionalModels.map((model, modelIndex) => {
                                const checked = selected.includes(model.id);
                                const modelId = `${id}-${model.id}`;
                                return (
                                  <GeoModelRow
                                    approved={nonZdrApproved.includes(model.id)}
                                    checked={checked}
                                    disabled={
                                      disabled || (checked && lastSelected)
                                    }
                                    id={modelId}
                                    key={model.id}
                                    model={model}
                                    onCheckedChange={(next) =>
                                      toggleModel(model, next)
                                    }
                                    revealed={allModelsShown}
                                    revealIndex={modelIndex}
                                    revealTotal={additionalModels.length}
                                    showZdrState={zdrActive}
                                  />
                                );
                              })}
                            </ul>
                          </div>
                        </li>
                      ) : null}
                      {additionalModels.length > 0 ? (
                        <li className="py-1.5 ps-10 pe-3">
                          <button
                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring cursor-pointer rounded-sm text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed"
                            disabled={disabled}
                            onClick={() => toggleShowAllModels(provider.id)}
                            type="button"
                          >
                            {allModelsShown
                              ? "Show fewer models"
                              : `Show ${additionalModels.length} other ${additionalModels.length === 1 ? "model" : "models"}`}
                          </button>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
        {catalog.providers.some((provider) => !provider.featured) ? (
          <li className="bg-card">
            <button
              aria-expanded={showMore}
              className="text-muted-foreground hover:bg-muted/40 hover:text-foreground focus-visible:ring-ring flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed"
              disabled={disabled}
              onClick={() => setShowMore((current) => !current)}
              type="button"
            >
              <span className="flex size-7 shrink-0 items-center justify-center">
                <HugeiconsIcon
                  className={cn(
                    "size-3.5 transition-transform duration-200 motion-reduce:transition-none",
                    showMore && "rotate-180"
                  )}
                  icon={ArrowDown01Icon}
                />
              </span>
              <span>
                {showMore
                  ? "Show fewer providers"
                  : `Show ${hiddenCount} more providers`}
              </span>
            </button>
          </li>
        ) : null}
      </ul>

      <div className="ring-foreground/10 divide-y rounded-lg ring-1">
        <div className={`${ROW_CLASS} py-2.5`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={`${id}-zdr`}>Enforce ZDR</Label>
              {canEnforceZdr ? null : (
                <Badge className="h-4 px-1.5 text-[0.625rem]" variant="outline">
                  Add-on
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {canEnforceZdr ? (
                "Only run models on zero-data-retention hosts. Not every model has one; those are marked in the list."
              ) : (
                <>
                  Zero data retention is an add-on for every plan, 20% on top of
                  the plan price. Not every model has a zero-data-retention
                  host; those are marked in the list.{" "}
                  {billingHref ? (
                    <Link
                      className="text-foreground underline underline-offset-4"
                      href={billingHref}
                    >
                      Add it in billing
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
              <TooltipTrigger render={<span className="inline-flex" />}>
                <Switch
                  aria-label="Add zero data retention"
                  checked={false}
                  className="cursor-pointer disabled:cursor-not-allowed"
                  disabled={disabled || planLoading || addonLoading}
                  id={`${id}-zdr`}
                  onCheckedChange={() => setConsentOpen(true)}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {planLoading
                  ? "Checking your plan…"
                  : "Add the zero data retention add-on to enforce it."}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <ZdrConsentDialog
        onConfirm={handleAddZdr}
        onOpenChange={setConsentOpen}
        open={consentOpen}
      />

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
