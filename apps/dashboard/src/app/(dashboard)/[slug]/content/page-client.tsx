"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@notra/ui/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { cn } from "@notra/ui/lib/utils";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import { CreateContentDialog } from "@/components/content/create-content-dialog";
import { GroupContentTypes } from "@/components/content/group/group-content-types";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useCollections } from "@/lib/hooks/use-collections";
import type { ContentListPageClientProps } from "@/types/content/collection";
import { formatRelativeDate, getPageNumbers } from "@/utils/content-preview";
import { GroupsPageSkeleton } from "./skeleton";

const HEADER_CLASS = "text-muted-foreground text-xs uppercase tracking-wider";

export default function PageClient({
  organizationSlug,
}: ContentListPageClientProps) {
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";
  const router = useRouter();

  const [rawPage, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
  );
  const page = Math.max(1, rawPage);

  const { data, isPending } = useCollections(organizationId, page);

  const collections = useMemo(
    () => data?.collections ?? [],
    [data?.collections]
  );
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">Content</h1>
            <p className="text-muted-foreground text-sm">
              Every batch of generated content, organized into collections.
            </p>
          </div>
          <CreateContentDialog organizationId={organizationId} />
        </div>

        {isPending && <GroupsPageSkeleton />}

        {!isPending && collections.length === 0 && (
          <EmptyState
            className="p-8"
            description="Generate your first piece of content to get started."
            title="No content yet"
          />
        )}

        {!isPending && collections.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(HEADER_CLASS, "min-w-[260px]")}>
                    Name
                  </TableHead>
                  <TableHead className={cn(HEADER_CLASS, "w-[160px]")}>
                    Types
                  </TableHead>
                  <TableHead className={cn(HEADER_CLASS, "w-[150px]")}>
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => {
                  const href = `/${organizationSlug}/collection/${collection.id}`;
                  return (
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      key={collection.id}
                      onClick={() => router.push(href)}
                      onMouseEnter={() => router.prefetch(href)}
                    >
                      <TableCell className="py-3">
                        <span className="line-clamp-1 font-medium">
                          {collection.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <GroupContentTypes
                          contentTypes={collection.contentTypes}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                        {formatRelativeDate(collection.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!isPending && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className={cn(page === 1 && "pointer-events-none opacity-50")}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(Math.max(1, page - 1));
                  }}
                />
              </PaginationItem>
              {getPageNumbers(page, totalPages).map((pageNumber, index) =>
                pageNumber === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  className={cn(
                    page === totalPages && "pointer-events-none opacity-50"
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    setPage(Math.min(totalPages, page + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </PageContainer>
  );
}
