"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

import { signOutOptionsSchema } from "@/schemas/auth-actions";
import type { SignOutActionOptions } from "@/types/auth";

export async function signOutAction(options?: SignOutActionOptions) {
  const parsed = signOutOptionsSchema.safeParse(options);
  const returnTo = parsed.success ? parsed.data?.returnTo : undefined;
  const appUrl = process.env.CONSOLE_APP_URL ?? "http://localhost:3003";
  await signOut({ returnTo: returnTo ?? `${appUrl}/login` });
}
