import { parseAsString, parseAsStringLiteral } from "nuqs/server";

import { marketingAttributionUrlKeys } from "./marketing-attribution-keys";

export const marketingAttributionServerSearchParams = {
  dbLandingPageH1Copy: parseAsString,
  dbLandingPageH1Variant: parseAsString,
  dbSource: parseAsString,
  signupMethod: parseAsStringLiteral(["email", "google", "github"]),
};

export const marketingAttributionServerUrlKeys = marketingAttributionUrlKeys;
