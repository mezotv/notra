"use client";

import { Button } from "@notra/ui/components/ui/button";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function BannedNotice() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-md border p-8 text-center">
      <h1 className="font-semibold text-lg">Account suspended</h1>
      <p className="text-muted-foreground text-sm">
        Your account has been suspended. If you believe this is a mistake,
        contact support at support@usenotra.com.
      </p>
      <Button disabled={isSigningOut} onClick={handleSignOut} variant="outline">
        Sign out
      </Button>
    </div>
  );
}
