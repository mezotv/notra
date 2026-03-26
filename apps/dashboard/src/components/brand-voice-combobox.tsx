"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@notra/ui/components/ui/combobox";
import { Label } from "@notra/ui/components/ui/label";
import { useCallback, useMemo, useState } from "react";
import type { BrandVoiceComboboxProps } from "@/types/components/brand-voice";

const DEFAULT_SENTINEL = "__default__";

export function BrandVoiceCombobox({
  voices,
  value,
  onChange,
  id,
}: BrandVoiceComboboxProps) {
  const [inputValue, setInputValue] = useState("");

  const defaultVoiceName = useMemo(
    () => voices.find((v) => v.isDefault)?.name,
    [voices]
  );

  const defaultLabel = defaultVoiceName
    ? `Default Voice (${defaultVoiceName})`
    : "Default Voice";

  const options = useMemo(() => {
    const nonDefault = voices.filter((v) => !v.isDefault);
    return [
      { id: DEFAULT_SENTINEL, label: defaultLabel },
      ...nonDefault.map((v) => ({ id: v.id, label: v.name })),
    ];
  }, [voices, defaultLabel]);

  const filteredOptions = useMemo(() => {
    if (!inputValue) {
      return options;
    }
    const query = inputValue.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, inputValue]);

  const labelMap = useMemo(
    () => Object.fromEntries(options.map((o) => [o.id, o.label])),
    [options]
  );

  const comboboxValue = value || DEFAULT_SENTINEL;

  const handleValueChange = useCallback(
    (next: string | null) => {
      const resolved =
        next && next !== DEFAULT_SENTINEL ? (next as string) : "";
      onChange(resolved);
    },
    [onChange]
  );

  const handleInputValueChange = useCallback(
    (nextInput: string) => {
      // When the user selects an item, input is set to the label — don't
      // treat that as a filter query.
      const isLabelMatch = Object.values(labelMap).some(
        (label) => label === nextInput
      );
      setInputValue(isLabelMatch ? "" : nextInput);
    },
    [labelMap]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Brand Voice</Label>
      <Combobox
        filter={null}
        inputValue={inputValue}
        itemToStringLabel={(itemId) => labelMap[itemId] ?? itemId}
        onInputValueChange={handleInputValueChange}
        onValueChange={handleValueChange}
        value={comboboxValue}
      >
        <ComboboxInput
          id={id}
          placeholder="Search brand voices..."
          showClear={comboboxValue !== DEFAULT_SENTINEL}
        />
        <ComboboxContent>
          {filteredOptions.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No brand voices found.
            </p>
          ) : (
            <ComboboxList>
              {filteredOptions.map((option) => (
                <ComboboxItem key={option.id} value={option.id}>
                  {option.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          )}
        </ComboboxContent>
      </Combobox>
      <p className="text-muted-foreground text-xs">
        Choose which brand voice to use for generated content.
      </p>
    </div>
  );
}
