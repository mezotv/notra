"use client";

import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Counter from "@notra/ui/components/Counter";
import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useId, useState } from "react";
import { ZdrConsentDialog } from "@/components/billing/zdr-consent-dialog";
import { Button } from "@/components/button";
import type { PlanCardProps } from "@/types/billing/plan";
import { planCardClassName } from "@/utils/billing-plans";

export function PlanCard({
  name,
  description,
  price,
  intervalLabel,
  features,
  featured,
  highlighted,
  action,
  addon,
  button,
}: PlanCardProps) {
  const listId = useId();
  const addonId = `${listId}-addon`;
  const [consentOpen, setConsentOpen] = useState(false);

  const handleAddonChange = (checked: boolean) => {
    if (!addon) {
      return;
    }
    if (checked) {
      setConsentOpen(true);
      return;
    }
    addon.onCheckedChange(false);
  };

  return (
    <TitleCard
      action={action}
      className={planCardClassName(highlighted, featured)}
      heading={name}
    >
      <div className="space-y-4">
        <div>
          <p className="line-clamp-2 min-h-10 text-muted-foreground text-sm">
            {description}
          </p>
          <div className="mt-2 flex items-end">
            <span className="font-bold text-3xl leading-none">$</span>
            <Counter
              fontSize={30}
              fontWeight={700}
              gap={0}
              gradientHeight={0}
              padding={0}
              value={price}
            />
            <span className="mb-0.5 ml-1 font-normal text-muted-foreground text-sm">
              /{intervalLabel}
            </span>
          </div>
        </div>

        {addon ? (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 ring-1 ring-foreground/10">
            <div className="space-y-0.5">
              <Label className="text-sm" htmlFor={addonId}>
                {addon.label}
              </Label>
              <p className="text-muted-foreground text-xs">
                {addon.description}
                {addon.hint ? (
                  <span className="text-muted-foreground/70">
                    {" "}
                    · {addon.hint}
                  </span>
                ) : null}
              </p>
            </div>
            <Switch
              checked={addon.checked}
              id={addonId}
              onCheckedChange={handleAddonChange}
            />
            <ZdrConsentDialog
              onConfirm={() => addon.onCheckedChange(true)}
              onOpenChange={setConsentOpen}
              open={consentOpen}
            />
          </div>
        ) : null}

        <Button
          className="w-full"
          disabled={button.disabled}
          onClick={button.onClick}
          variant={button.variant}
        >
          {button.label}
        </Button>

        <ul className="space-y-2.5 pt-2">
          {features.map((feature) => (
            <li
              className="flex items-start gap-2 text-sm"
              key={`${listId}-${feature.text}`}
            >
              <HugeiconsIcon
                className="mt-0.5 size-4 shrink-0 text-emerald-500"
                icon={CheckmarkCircle02Icon}
              />
              <div>
                <span>{feature.text}</span>
                {feature.overageText &&
                  (feature.overageTooltip ? (
                    <Tooltip>
                      <TooltipTrigger
                        className="cursor-help border-muted-foreground/30 border-b border-dashed text-muted-foreground text-xs"
                        render={<p />}
                      >
                        {feature.overageText}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-56">
                        {feature.overageTooltip}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {feature.overageText}
                    </p>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </TitleCard>
  );
}
