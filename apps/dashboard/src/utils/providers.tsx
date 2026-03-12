"use client";

import { Databuddy } from "@databuddy/sdk/react";
import { Toaster } from "@notra/ui/components/ui/sonner";
import { TooltipProvider } from "@notra/ui/components/ui/tooltip";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AutumnProvider } from "autumn-js/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { toast } from "sonner";

const databuddyClientID = process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      const message = query.meta?.errorMessage;
      if (typeof message === "string") {
        toast.error(message);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
    mutations: {
      retry: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
        <TooltipProvider>
          <AutumnProvider includeCredentials>
            <NuqsAdapter>
              {children}
              {databuddyClientID && (
                <Databuddy
                  clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID}
                  trackAttributes={true}
                  trackErrors={true}
                  trackHashChanges={true}
                  trackScrollDepth={true}
                />
              )}
            </NuqsAdapter>
            <Toaster position="top-center" />
          </AutumnProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
