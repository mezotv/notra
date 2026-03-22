export interface AutumnCheckResponse {
  allowed?: boolean;
  balance?: unknown;
}

export interface AutumnBalanceCheckResponse {
  allowed?: boolean;
  balance?: {
    unlimited?: boolean;
    remaining?: number;
  } | null;
}
