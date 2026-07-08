import type { SessionContext } from "eve/context";

export function requireOrganizationId(ctx: SessionContext): string {
  const caller = ctx.session.auth.current ?? ctx.session.auth.initiator;
  const organizationId = caller?.attributes.organizationId;
  if (typeof organizationId !== "string" || organizationId.length === 0) {
    throw new Error(
      "No organization is bound to this session. Organization-scoped tools are unavailable on research-only runs."
    );
  }
  return organizationId;
}
