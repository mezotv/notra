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
import { RealtimeProvider } from "@upstash/realtime/client";
import { AutumnProvider } from "autumn-js/react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { toast } from "sonner";
import {
  DATABUDDY_DASHBOARD_MASK_PATTERNS,
  normalizeDatabuddyEventPath,
} from "@/utils/databuddy";

const databuddyClientID =
  process.env.NEXT_PUBLIC_DATABUDDY_DASHBOARD_WEBSITE_ID;

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

function DatabuddyAnalytics() {
  if (!databuddyClientID) {
    return null;
  }

  return (
    <Databuddy
      clientId={databuddyClientID}
      filter={normalizeDatabuddyEventPath}
      maskPatterns={DATABUDDY_DASHBOARD_MASK_PATTERNS}
      trackAttributes={true}
      trackErrors={true}
      trackHashChanges={true}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} />
      <ThemeProvider attribute="class" disableTransitionOnChange enableSystem>
        <TooltipProvider>
          <AutumnProvider includeCredentials>
            <NuqsAdapter>
              <RealtimeProvider
                api={{ url: "/api/realtime", withCredentials: true }}
                maxReconnectAttempts={5}
              >
                {children}
              </RealtimeProvider>
              <DatabuddyAnalytics />
            </NuqsAdapter>
            <Toaster position="top-center" />
          </AutumnProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
