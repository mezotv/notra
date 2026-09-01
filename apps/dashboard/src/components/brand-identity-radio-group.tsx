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
  subtitle?: string;
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
        "bg-card hover:border-foreground/20 flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-lg border px-3 py-3 font-normal transition-colors",
        isSelected
          ? "border-foreground/40 ring-foreground/10 ring-2"
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
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && (
          <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
        )}
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
    <div className="min-w-0 space-y-2">
      {label && (
        <p className="text-sm font-medium" id={labelId}>
          {label}
        </p>
      )}
      <RadioGroup
        aria-labelledby={label ? labelId : undefined}
        className="min-w-0 gap-2"
        onValueChange={handleValueChange}
        value={groupValue}
      >
        {emptyOption && (
          <BrandIdentityOptionCard
            fallback={emptyOption.voice?.name.slice(0, 2).toUpperCase()}
            faviconUrl={getBrandFaviconUrl(
              emptyOption.voice?.websiteUrl ?? null
            )}
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
