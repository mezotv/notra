"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Calendar03Icon,
  Copy01Icon,
  Link04Icon,
  MoreVerticalIcon,
  Notification03Icon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Slack } from "@notra/ui/components/ui/svgs/slack";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";
import type {
  IntegrationType,
  Log,
  StatusWithCode,
} from "@/types/webhooks/webhooks";

const columnHelper = createColumnHelper<Log>();

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: StatusWithCode }) {
  const variants: Record<
    StatusWithCode["label"],
    "default" | "destructive" | "secondary"
  > = {
    success: "default",
    failed: "destructive",
    pending: "secondary",
  };

  return (
    <Badge className="capitalize" variant={variants[status.label]}>
      {status.label}
    </Badge>
  );
}

function getSortIcon(isSorted: false | "asc" | "desc") {
  if (isSorted === "asc") {
    return ArrowUp01Icon;
  }
  if (isSorted === "desc") {
    return ArrowDown01Icon;
  }
  return ArrowUpDownIcon;
}

function IntegrationIcon({ type }: { type: IntegrationType }) {
  switch (type) {
    case "github":
      return <Github className="size-4" />;
    case "linear":
      return <Linear className="size-4" />;
    case "slack":
      return <Slack className="size-4" />;
    case "webhook":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Link04Icon}
        />
      );
    case "manual":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={PlayCircleIcon}
        />
      );
    case "schedule":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Calendar03Icon}
        />
      );
    case "events":
      return (
        <HugeiconsIcon
          className="size-4 text-muted-foreground"
          icon={Notification03Icon}
        />
      );
    default: {
      return type;
    }
  }
}

export const columns = [
  columnHelper.accessor("title", {
    header: "Title",
    cell: (info) => {
      const title = info.getValue();
      const errorMessage = info.row.original.errorMessage;
      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="text-left">
              <span className="block max-w-56 truncate font-medium">
                {title}
              </span>
              {errorMessage && (
                <span className="block max-w-56 truncate text-muted-foreground text-xs">
                  {errorMessage}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-56">
            <p>{title}</p>
            {errorMessage && (
              <p className="mt-1 text-muted-foreground">{errorMessage}</p>
            )}
          </TooltipContent>
        </Tooltip>
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
      return status.code !== null ? (
        <Tooltip>
          <TooltipTrigger>
            <StatusBadge status={status} />
          </TooltipTrigger>
          <TooltipContent>{`Status code: ${status.code}`}</TooltipContent>
        </Tooltip>
      ) : (
        <StatusBadge status={status} />
      );
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
        {formatDate(info.getValue())}
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
          <DropdownMenuTrigger className="flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-accent">
            <HugeiconsIcon
              className="size-4 text-muted-foreground"
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
