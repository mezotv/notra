export interface AiCreditReservation {
  allowed: boolean;
  reserved: boolean;
  useMarkup: boolean;
  lockId: string | null;
}

export interface AiCreditFinalizeInput {
  lockId: string | null;
  costCents: number;
  properties?: Record<string, string | number | boolean>;
}
