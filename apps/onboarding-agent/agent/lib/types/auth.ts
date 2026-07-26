import type { AuthFn } from "eve/channels/auth";

export type VerifiedSessionAuth = NonNullable<
  Awaited<ReturnType<AuthFn<Request>>>
>;
