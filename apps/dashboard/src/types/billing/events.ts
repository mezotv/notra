export type CreditEvent = {
  id: string;
  timestamp: number;
  feature_id: string;
  customer_id: string;
  value: number;
  properties: Record<string, unknown>;
};

export type CreditEventsResponse = {
  list: CreditEvent[];
  total: number;
  has_more: boolean;
  offset: number;
  limit: number;
};
