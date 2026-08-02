"use client";

import { TranslateIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  GEO_LANGUAGE_CODES,
  GEO_LANGUAGE_LABELS,
  GEO_MAX_PROMPT_LANGUAGES,
} from "@/constants/geo";
import type {
  GeoLanguageCode,
  GeoPromptLanguageSelectProps,
} from "@/types/geo";

export function PromptLanguageSelect({
  value,
  onChange,
  disabled,
}: GeoPromptLanguageSelectProps) {
  const toggleLanguage = (code: GeoLanguageCode, checked: boolean) => {
    if (checked) {
      if (value.length >= GEO_MAX_PROMPT_LANGUAGES) {
        return;
      }
      onChange([...value, code]);
      return;
    }
    onChange(value.filter((language) => language !== code));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Track in more languages"
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <HugeiconsIcon icon={TranslateIcon} size={16} />
            {value.length > 0
              ? value
                  .map((code) => GEO_LANGUAGE_LABELS[code] ?? code)
                  .join(", ")
              : "Languages"}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Also ask in (up to {GEO_MAX_PROMPT_LANGUAGES})
        </DropdownMenuLabel>
        {GEO_LANGUAGE_CODES.map((code) => (
          <DropdownMenuCheckboxItem
            checked={value.includes(code)}
            disabled={
              !value.includes(code) && value.length >= GEO_MAX_PROMPT_LANGUAGES
            }
            key={code}
            onCheckedChange={(checked) => toggleLanguage(code, checked)}
          >
            {GEO_LANGUAGE_LABELS[code] ?? code}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
