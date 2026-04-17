"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useId } from "react";
import { PageContainer } from "@/components/layout/container";

function CardShell({
  children,
  fullWidth = false,
  headingWidth = "w-32",
}: {
  children: React.ReactNode;
  fullWidth?: boolean;
  headingWidth?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border/80 bg-muted/80 p-2 ${
        fullWidth ? "lg:col-span-2" : ""
      }`}
    >
      <div className="px-2 py-1.5">
        <Skeleton className={`h-6 ${headingWidth}`} />
      </div>
      <div className="rounded-lg border border-border/80 bg-background px-4 py-4">
        {children}
      </div>
    </div>
  );
}

function ToggleRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full max-w-xs" />
      </div>
      <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
    </div>
  );
}

function ProviderRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  );
}

export function AccountPageSkeleton() {
  const id = useId();
  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CardShell headingWidth="w-28">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-md" />
                  <Skeleton className="h-9 w-16 rounded-md" />
                </div>
              </div>
            </div>
          </CardShell>

          <CardShell headingWidth="w-28">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="space-y-3 border-t pt-4">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div className="space-y-2" key={`${id}-pwd-${i}`}>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-full rounded-md" />
                  </div>
                ))}
                <Skeleton className="mt-2 h-9 w-36 rounded-md" />
              </div>
            </div>
          </CardShell>

          <CardShell fullWidth headingWidth="w-44">
            <div className="space-y-3">
              <Skeleton className="h-4 w-72" />
              <ProviderRowSkeleton />
              <ProviderRowSkeleton />
            </div>
          </CardShell>

          <CardShell fullWidth headingWidth="w-36">
            <div className="space-y-3">
              <Skeleton className="h-4 w-64" />
              <ProviderRowSkeleton />
            </div>
          </CardShell>

          <CardShell fullWidth headingWidth="w-20">
            <div className="space-y-4">
              <Skeleton className="h-4 w-72" />
              <ToggleRowSkeleton />
            </div>
          </CardShell>

          <CardShell fullWidth headingWidth="w-14">
            <div className="space-y-4">
              <Skeleton className="h-4 w-72" />
              <ToggleRowSkeleton />
            </div>
          </CardShell>

          <CardShell fullWidth headingWidth="w-36">
            <div className="space-y-3">
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-9 w-40 rounded-md" />
            </div>
          </CardShell>
        </div>
      </div>
    </PageContainer>
  );
}
