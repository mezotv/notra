"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Label } from "@notra/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@notra/ui/components/ui/radio-group";
import { cn } from "@notra/ui/lib/utils";
import { useId } from "react";
import type { BrandIdentityRadioGroupProps } from "@/types/components/brand-identity";
import { getBrandFaviconUrl } from "@/utils/brand";

const EMPTY_SENTINEL = "__none__";

interface BrandIdentityOptionCardProps {
  itemId: string;
  itemValue: string;
  title: string;
  subtitle: string;
  isSelected: boolean;
  faviconUrl?: string;
  fallback?: string;
}

function BrandIdentityOptionCard({
  itemId,
  itemValue,
  title,
  subtitle,
  isSelected,
  faviconUrl,
  fallback,
}: BrandIdentityOptionCardProps) {
  return (
    <Label
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-3 font-normal transition-colors hover:border-foreground/20",
        isSelected
          ? "border-foreground/40 ring-2 ring-foreground/10"
          : "border-border"
      )}
      htmlFor={itemId}
    >
      <RadioGroupItem className="shrink-0" id={itemId} value={itemValue} />
      {fallback !== undefined && (
        <Avatar className="size-8 rounded-full after:rounded-full" size="sm">
          <AvatarImage src={faviconUrl} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="truncate text-muted-foreground text-xs">{subtitle}</p>
      </div>
    </Label>
  );
}

export function BrandIdentityRadioGroup({
  voices,
  value,
  onChange,
  emptyOption,
  label,
  description,
  id,
}: BrandIdentityRadioGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const labelId = `${groupId}-label`;
  const groupValue = value === "" ? EMPTY_SENTINEL : value;

  const handleValueChange = (next: unknown) => {
    onChange(next === EMPTY_SENTINEL ? "" : String(next));
  };

  return (
    <div className="space-y-2">
      {label && (
        <p className="font-medium text-sm" id={labelId}>
          {label}
        </p>
      )}
      <RadioGroup
        aria-labelledby={label ? labelId : undefined}
        className="gap-2"
        onValueChange={handleValueChange}
        value={groupValue}
      >
        {emptyOption && (
          <BrandIdentityOptionCard
            isSelected={value === ""}
            itemId={`${groupId}-none`}
            itemValue={EMPTY_SENTINEL}
            subtitle={emptyOption.description}
            title={emptyOption.label}
          />
        )}
        {voices.map((voice) => (
          <BrandIdentityOptionCard
            fallback={voice.name.slice(0, 2).toUpperCase()}
            faviconUrl={getBrandFaviconUrl(voice.websiteUrl)}
            isSelected={value === voice.id}
            itemId={`${groupId}-${voice.id}`}
            itemValue={voice.id}
            key={voice.id}
            subtitle={
              voice.isDefault ? "Default brand identity" : "Brand identity"
            }
            title={voice.name}
          />
        ))}
      </RadioGroup>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}
