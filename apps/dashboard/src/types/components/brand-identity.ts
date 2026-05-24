import type { BrandSettings } from "@/types/hooks/brand-analysis";

export interface BrandIdentityEmptyOption {
  label: string;
  description: string;
}

export interface BrandIdentityRadioGroupProps {
  voices: BrandSettings[];
  value: string;
  onChange: (value: string) => void;
  emptyOption?: BrandIdentityEmptyOption;
  label?: string;
  description?: string;
  id?: string;
}
