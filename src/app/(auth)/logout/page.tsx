"use client";
import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";

export default function LogoutPage() {
  useEffect(() => {
    authClient.signOut();
  }, []);

  return <div>Logging out...</div>;
}
