import type { NextResponse } from "next/server";
import type { getServerSession } from "@/lib/auth/session";

export type User = NonNullable<
  Awaited<ReturnType<typeof getServerSession>>["user"]
>;

export interface OrganizationContext {
  user: User;
  organizationId: string;
  membership: {
    id: string;
    role: string;
  };
}

export interface OrganizationAuthResult {
  success: true;
  context: OrganizationContext;
}

export interface OrganizationAuthError {
  success: false;
  response: NextResponse;
}

export type OrganizationAuth = OrganizationAuthResult | OrganizationAuthError;
