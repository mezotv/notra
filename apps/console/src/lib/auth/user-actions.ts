"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

export async function signOutAction(options?: { returnTo?: string }) {
  const appUrl = process.env.CONSOLE_APP_URL ?? "http://localhost:3003";
  await signOut({ returnTo: options?.returnTo ?? `${appUrl}/login` });
}
