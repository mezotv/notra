type OAuthSearchParams = Record<string, string | string[] | undefined>;

const OAUTH_SIGNATURE_PARAM = "sig";
const OAUTH_CLIENT_ID_PARAM = "client_id";

export function buildOAuthQueryString(searchParams: OAuthSearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      params.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    }
  }

  return params.toString();
}

export function hasSignedOAuthQuery(searchParams: OAuthSearchParams) {
  return (
    typeof searchParams[OAUTH_SIGNATURE_PARAM] === "string" &&
    typeof searchParams[OAUTH_CLIENT_ID_PARAM] === "string"
  );
}

export function buildOAuthAuthorizePath(searchParams: OAuthSearchParams) {
  const query = buildOAuthQueryString(searchParams);
  return query
    ? `/api/auth/oauth2/authorize?${query}`
    : "/api/auth/oauth2/authorize";
}
