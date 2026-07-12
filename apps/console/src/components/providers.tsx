"use client";

import { Toaster } from "@notra/ui/components/ui/sonner";
import { TooltipProvider } from "@notra/ui/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
