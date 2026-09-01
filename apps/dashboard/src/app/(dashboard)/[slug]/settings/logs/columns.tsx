"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Copy01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { IntegrationIcon } from "@/components/logs/integration-icon";
import { LogStatusBadge } from "@/components/logs/log-status-badge";
import type { Log, StatusWithCode } from "@/types/webhooks/webhooks";
import { formatLogTimestamp } from "@/utils/logs";

const columnHelper = createColumnHelper<Log>();

function getSortIcon(isSorted: false | "asc" | "desc") {
  if (isSorted === "asc") {
    return ArrowUp01Icon;
  }
  if (isSorted === "desc") {
    return ArrowDown01Icon;
  }
  return ArrowUpDownIcon;
}

export const columns = [
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => {
      const title = info.getValue();
      const errorMessage = info.row.original.errorMessage;
      return (
        <div className="min-w-0 text-left">
          <span className="block truncate font-medium">{title}</span>
          {errorMessage ? (
            <span className="text-muted-foreground block truncate text-xs">
              {errorMessage}
            </span>
          ) : null}
        </div>
      );
    },
  }),
  columnHelper.accessor("integrationType", {
    header: "Integration",
    cell: (info) => {
      const type = info.getValue();
      return (
        <div className="flex items-center gap-2">
          <IntegrationIcon type={type} />
          <span className="capitalize">{type}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const label = info.getValue();
      const code = info.row.original.statusCode;
      const status = { label, code } as StatusWithCode;
      return <LogStatusBadge status={status} />;
    },
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Created At
          <HugeiconsIcon className="ml-2 size-4" icon={getSortIcon(isSorted)} />
        </Button>
      );
    },
    cell: (info) => (
      <span className="text-muted-foreground">
        {formatLogTimestamp(info.getValue())}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: (info) => {
      const referenceId = info.row.original.referenceId;
      if (!referenceId) {
        return null;
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-accent flex size-8 cursor-pointer items-center justify-center rounded-md">
            <HugeiconsIcon
              className="text-muted-foreground size-4"
              icon={MoreVerticalIcon}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(referenceId);
                toast.success("Reference ID copied");
              }}
            >
              <HugeiconsIcon className="size-4" icon={Copy01Icon} />
              Copy reference ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
];
