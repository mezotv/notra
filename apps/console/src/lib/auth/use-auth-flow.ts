"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import type { AuthMethod, SocialProvider } from "@/types/auth";

export function useAuthFlow(errorMessage: string) {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const inFlightRef = useRef(false);

  const begin = (method: AuthMethod) => {
    if (inFlightRef.current) {
      return false;
    }

    inFlightRef.current = true;
    setAuthMethod(method);
    return true;
  };

  const reset = () => {
    inFlightRef.current = false;
    setAuthMethod(null);
  };

  const signInWithProvider = async (provider: SocialProvider) => {
    if (!begin(provider)) {
      return;
    }

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
      if (result.error) {
        toast.error(errorMessage);
        reset();
      }
    } catch {
      toast.error(errorMessage);
      reset();
    }
  };

  return {
    authMethod,
    isAuthLoading: authMethod !== null,
    begin,
    reset,
    signInWithProvider,
  };
}
