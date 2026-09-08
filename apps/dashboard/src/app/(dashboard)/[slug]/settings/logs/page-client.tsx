"use client";

import {
  Cancel01Icon,
  InformationCircleIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { FEATURES } from "@notra/ai/billing/features";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import { useState } from "react";

import { PageContainer } from "@/components/layout/container";
import { LogDetailsSheet } from "@/components/logs/log-details-sheet";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import {
  SOURCE_LABELS,
  SOURCE_VALUES,
  STATUS_LABELS,
  STATUS_VALUES,
} from "@/constants/logs";
import { useBillingCustomer } from "@/lib/hooks/use-billing-customer";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { Log, LogsResponse } from "@/types/webhooks/webhooks";
import { getSourceLabel, getStatusLabel } from "@/utils/logs";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { LogsPageSkeleton } from "./skeleton";

const SEARCH_DEBOUNCE_MS = 150;

interface PageClientProps {
  organizationSlug: string;
}

export default function PageClient({ organizationSlug }: PageClientProps) {
  const { getOrganization } = useOrganizationsContext();
  const organization = getOrganization(organizationSlug);
  const organizationId = organization?.id;
  const { check, data: customer } = useBillingCustomer();

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [source, setSource] = useQueryState(
    "source",
    parseAsStringLiteral(SOURCE_VALUES).withDefault("all")
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUS_VALUES).withDefault("all")
  );
  const [searchInput, setSearchInput] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  const commitSearch = useDebouncedCallback(
    (value: string) => {
      setSearch(value);
      if (page !== 1) {
        setPage(1);
      }
    },
    { wait: SEARCH_DEBOUNCE_MS }
  );

  const has30DayRetention = customer
    ? check({ featureId: FEATURES.LOG_RETENTION_30_DAYS }).allowed
    : false;
  const has14DayRetention = customer
    ? check({ featureId: FEATURES.LOG_RETENTION_14_DAYS }).allowed
    : false;
  let logRetentionDays = 7;
  if (has30DayRetention) {
    logRetentionDays = 30;
  } else if (has14DayRetention) {
    logRetentionDays = 14;
  }

  const resetPage = () => {
    if (page !== 1) {
      setPage(1);
    }
  };

  const { data, isPending } = useQuery<LogsResponse>({
    ...dashboardOrpc.logs.webhooks.list.queryOptions({
      input: {
        organizationId: organizationId ?? "",
        integrationType: "github",
        integrationId: "all",
        page,
        pageSize: 10,
        source,
        status,
        search,
      },
    }),
    enabled: !!organizationId,
    placeholderData: keepPreviousData,
  });

  const logs = data?.logs ?? [];

  const filtersActive =
    source !== "all" || status !== "all" || search.length > 0;

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setSource("all");
    setStatus("all");
    resetPage();
  };

  return (
    <PageContainer
      className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6"
      variant="default"
    >
      <div className="w-full space-y-6 px-4 lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
            <Tooltip>
              <TooltipTrigger
                aria-label="Log retention information"
                className="text-muted-foreground hover:text-foreground cursor-help transition-colors"
              >
                <HugeiconsIcon
                  className="size-4"
                  icon={InformationCircleIcon}
                />
              </TooltipTrigger>
              <TooltipContent>
                Log data is retained for {logRetentionDays} days. Older entries
                are automatically removed.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground">
            View all integration events and their delivery status
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <HugeiconsIcon
              className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              icon={Search01Icon}
            />
            <Input
              aria-label="Search logs"
              autoComplete="off"
              className="pr-8 pl-8"
              name="log-search"
              onChange={(e) => {
                setSearchInput(e.target.value);
                commitSearch(e.target.value);
              }}
              placeholder="Search by title or error message"
              type="text"
              value={searchInput}
            />
            {searchInput.length > 0 && (
              <button
                aria-label="Clear search"
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => {
                  setSearchInput("");
                  commitSearch("");
                }}
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-3.5"
                  icon={Cancel01Icon}
                />
              </button>
            )}
          </div>
          <Select
            onValueChange={(value) => {
              setSource(value);
              resetPage();
            }}
            value={source}
          >
            <SelectTrigger aria-label="Filter by source" className="sm:w-44">
              <SelectValue>
                {(value: string) => getSourceLabel(value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SOURCE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {SOURCE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              setStatus(value);
              resetPage();
            }}
            value={status}
          >
            <SelectTrigger aria-label="Filter by status" className="sm:w-40">
              <SelectValue>
                {(value: string) => getStatusLabel(value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {organizationId && isPending ? (
          <LogsPageSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={logs}
            emptyState={
              filtersActive
                ? {
                    title: "No logs match your filters",
                    description: "Try a different search, source, or status.",
                    actionLabel: "Reset filters",
                    onActionClick: resetFilters,
                  }
                : {
                    title: "No logs yet",
                    description:
                      "Activity from your integrations and automations will show up here.",
                  }
            }
            getRowId={(log) => log.id}
            onPageChange={setPage}
            onRowClick={setSelectedLog}
            page={page}
            totalPages={data?.pagination.totalPages ?? 1}
          />
        )}
        <LogDetailsSheet
          log={selectedLog}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedLog(null);
            }
          }}
          open={selectedLog !== null}
        />
      </div>
    </PageContainer>
  );
}
