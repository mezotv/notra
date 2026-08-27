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
import { useMemo, useState } from "react";

import { CreateContentButton } from "@/components/content/create-content-button";
import { CreateContentDialog } from "@/components/content/create-content-dialog";
import { GroupContentTypes } from "@/components/content/group/group-content-types";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
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
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Content</h1>
            <p className="text-muted-foreground text-sm">
              Every batch of generated content, organized into collections.
            </p>
          </div>
          <CreateContentButton
            disabled={!organizationId}
            onClick={() => setCreateOpen(true)}
          />
        </div>

        {isPending && <GroupsPageSkeleton />}

        {!isPending && collections.length === 0 && (
          <EmptyState
            action={
              <CreateContentButton
                disabled={!organizationId}
                onClick={() => setCreateOpen(true)}
              />
            }
            description="Generate your first piece of content to get started."
            preview={
              <EmptyStateTablePreview
                columns={EMPTY_STATE_TABLE_COLUMNS.content}
                rows={EMPTY_STATE_TABLE_ROWS}
              />
            }
            title="No content yet"
          />
        )}

        {!isPending && collections.length > 0 && (
          <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border shadow-2xs">
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
                      className="hover:bg-muted/50 cursor-pointer"
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
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
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
      <CreateContentDialog
        hideTrigger
        onOpenChange={setCreateOpen}
        open={createOpen}
        organizationId={organizationId}
      />
    </PageContainer>
  );
}
