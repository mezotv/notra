"use client";

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from "@notra/ai/constants/languages";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@notra/ui/components/ui/combobox";
import { Twemoji } from "@/components/geo/twemoji";
import { GEO_LANGUAGE_FLAGS, GEO_MAX_LANGUAGES } from "@/constants/geo";
import type { GeoLanguagePickerProps } from "@/types/geo";

const EXTRA_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  (language) => language !== DEFAULT_LANGUAGE
);

function LanguageLabel({ language }: { language: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Twemoji
        className="size-3.5 shrink-0"
        emoji={GEO_LANGUAGE_FLAGS[language] ?? ""}
        label={language}
      />
      {language}
    </span>
  );
}

export function GeoLanguagePicker({
  selected,
  onChange,
  disabled = false,
  labeled = true,
}: GeoLanguagePickerProps) {
  const anchor = useComboboxAnchor();
  const atLimit = selected.length >= GEO_MAX_LANGUAGES;
  const items = atLimit ? selected : EXTRA_LANGUAGES;

  return (
    <div className="w-full min-w-0 space-y-2">
      {labeled ? (
        <div className="space-y-1">
          <p className="font-medium text-sm">Languages</p>
          <p className="text-muted-foreground text-xs">
            {DEFAULT_LANGUAGE} is always scanned. Add up to {GEO_MAX_LANGUAGES}{" "}
            more.
          </p>
        </div>
      ) : null}
      <div className="w-full min-w-0" ref={anchor}>
        <Combobox
          disabled={disabled}
          items={items}
          multiple
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value : [];
            onChange(next.slice(0, GEO_MAX_LANGUAGES));
          }}
          value={selected}
        >
          <ComboboxChips className="w-full min-w-0 has-data-[slot=combobox-chip]:px-2.5">
            {selected.map((language) => (
              <ComboboxChip key={language}>
                <LanguageLabel language={language} />
              </ComboboxChip>
            ))}
            {atLimit ? null : (
              <ComboboxChipsInput
                aria-label="Add a language"
                placeholder="Add a language"
              />
            )}
          </ComboboxChips>
          {atLimit ? null : (
            <ComboboxContent anchor={anchor.current}>
              <ComboboxEmpty>No languages match</ComboboxEmpty>
              <ComboboxList>
                {EXTRA_LANGUAGES.map((language) => (
                  <ComboboxItem key={language} value={language}>
                    <LanguageLabel language={language} />
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          )}
        </Combobox>
      </div>
    </div>
  );
}
