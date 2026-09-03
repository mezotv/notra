export interface CreditBalanceSummaryProps {
  balance: number | null;
  included: number | null;
  isLoading: boolean;
}

export interface CreditAmountPickerProps {
  customAmount: string;
  isCustom: boolean;
  isCustomValid: boolean;
  loading: boolean;
  selected: number | null;
  onCustomAmountChange: (value: string) => void;
  onCustomFocus: () => void;
  onPresetSelect: (amount: number) => void;
}

export interface CreditTopupSubmitButtonProps {
  activeAmount: number | null;
  loading: boolean;
  onClick: () => void;
}
