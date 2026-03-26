export interface BrandVoice {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface BrandVoiceComboboxProps {
  voices: BrandVoice[];
  /** The raw brand voice ID — empty string means "use default". */
  value: string;
  onChange: (value: string) => void;
  id?: string;
}
