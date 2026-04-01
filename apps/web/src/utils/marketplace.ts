export const MARKETPLACE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "payments", label: "Payments" },
  { value: "email", label: "Email" },
  { value: "cloud", label: "Cloud" },
  { value: "devtools", label: "DevTools" },
] as const;

export type MarketplaceCategory =
  (typeof MARKETPLACE_CATEGORIES)[number]["value"];

export const MARKETPLACE_DISCLAIMER =
  "Notra is not affiliated with any of the companies listed above. Brand identities are curated for demonstration purposes only.";
