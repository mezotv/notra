"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

export async function signOutAction(options?: { returnTo?: string }) {
  await signOut(options);
}
