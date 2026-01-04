"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Github01Icon,
  Link04Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Log, IntegrationType, LogDirection } from "@/types/webhook-logs";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: Log["status"] }) {
  const variants: Record<
    Log["status"],
    "default" | "destructive" | "secondary"
  > = {
    success: "default",
    failed: "destructive",
    pending: "secondary",
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}

function DirectionBadge({ direction }: { direction: LogDirection }) {
  return (
    <Badge variant="outline" className="capitalize">
      {direction}
    </Badge>
  );
}

function IntegrationIcon({ type }: { type: IntegrationType }) {
  const icons: Record<IntegrationType, typeof Github01Icon> = {
    github: Github01Icon,
    linear: Link04Icon,
    slack: Notification01Icon,
    webhook: Link04Icon,
  };

  return (
    <HugeiconsIcon
      icon={icons[type]}
      className="size-4 text-muted-foreground"
    />
  );
}

export const columns: ColumnDef<Log>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "integrationType",
    header: "Integration",
    cell: ({ row }) => {
      const type = row.getValue("integrationType") as IntegrationType;
      return (
        <div className="flex items-center gap-2">
          <IntegrationIcon type={type} />
          <span className="capitalize">{type}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => (
      <DirectionBadge direction={row.getValue("direction")} />
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "statusCode",
    header: "Code",
    cell: ({ row }) => {
      const code = row.getValue("statusCode") as number | null;
      return <span className="text-muted-foreground">{code ?? "-"}</span>;
    },
  },
  {
    accessorKey: "responseTime",
    header: "Response Time",
    cell: ({ row }) => {
      const time = row.getValue("responseTime") as number | null;
      return (
        <span className="text-muted-foreground">
          {time ? `${time}ms` : "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Created At
          <HugeiconsIcon
            icon={
              isSorted === "asc"
                ? ArrowUp01Icon
                : isSorted === "desc"
                  ? ArrowDown01Icon
                  : ArrowUpDownIcon
            }
            className="ml-2 size-4"
          />
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
  },
];
