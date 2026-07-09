import type { SessionContext } from "eve/context";

export function requireOrganizationId(ctx: SessionContext): string {
  const organizationId =
    ctx.session.auth.current?.attributes.organizationId ??
    ctx.session.auth.initiator?.attributes.organizationId;
  if (typeof organizationId !== "string" || organizationId.length === 0) {
    throw new Error(
      "No organization is bound to this session. Organization-scoped tools are unavailable on research-only runs."
    );
  }
  return organizationId;
}
