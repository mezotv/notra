import type { OrganizationScope } from "@notra/db/types/roles";
import type {
  AuthenticatedUser,
  OrganizationContext,
} from "@/types/auth/organization";

export interface ScopedOrganizationContext extends OrganizationContext {
  scopes: OrganizationScope[];
}

interface ScopedOrganizationAuthResult {
  success: true;
  context: ScopedOrganizationContext;
}

interface ScopedOrganizationAuthError {
  success: false;
  response: Response;
}

export type ScopedOrganizationAuth =
  | ScopedOrganizationAuthResult
  | ScopedOrganizationAuthError;

export interface AssertOrganizationScopesParams {
  headers: Headers;
  organizationId: string;
  user?: AuthenticatedUser;
  scopes?: OrganizationScope[];
  anyOfScopes?: OrganizationScope[];
}
