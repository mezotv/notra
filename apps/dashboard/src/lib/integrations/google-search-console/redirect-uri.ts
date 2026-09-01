import { GSC_OAUTH_CALLBACK_PATH } from "@notra/geo-core/constants/google-search-console";

export const getGscRedirectUri = (baseUrl: string): string =>
  new URL(GSC_OAUTH_CALLBACK_PATH, baseUrl).toString();
