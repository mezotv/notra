export type CliPollResponse =
  | { status: "pending" }
  | { status: "ready"; apiKey: string }
  | { status: "expired" };

export type CliAuthorizeResponse = { status: "ok" } | { error: string };

export interface CliAuthOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}
