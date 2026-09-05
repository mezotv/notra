"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@notra/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { useRouter } from "next/navigation";

import { SKILL_TYPE_LABELS } from "@/constants/skills";
import { cn } from "@/lib/utils";
import type {
  SkillSortKey,
  SkillSortState,
  SkillsTableProps,
} from "@/types/skills/page";
import { formatSkillUpdatedAt, toggleSkillSort } from "@/utils/skills";

const HEADER_CLASS = "text-muted-foreground text-xs uppercase tracking-wider";

function getSortIcon(sort: SkillSortState, key: SkillSortKey) {
  if (sort.key !== key) {
    return ArrowUpDownIcon;
  }
  return sort.direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon;
}

function getAriaSort(
  active: boolean,
  direction: SkillSortState["direction"]
): "ascending" | "descending" | "none" {
  if (!active) {
    return "none";
  }
  return direction === "asc" ? "ascending" : "descending";
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  sortKey: SkillSortKey;
  sort: SkillSortState;
  onSortChange: (sort: SkillSortState) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const ariaSort = getAriaSort(active, sort.direction);
  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        className={cn(
          HEADER_CLASS,
          "hover:text-foreground focus-visible:ring-ring -ml-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
          active && "text-foreground"
        )}
        onClick={() => onSortChange(toggleSkillSort(sort, sortKey))}
        type="button"
      >
        {label}
        <HugeiconsIcon
          aria-hidden="true"
          className={cn("size-3.5", !active && "opacity-60")}
          icon={getSortIcon(sort, sortKey)}
        />
      </button>
    </TableHead>
  );
}

export function SkillsTable({
  slug,
  skills,
  sort,
  onSortChange,
  searchActive,
}: SkillsTableProps) {
  const router = useRouter();

  if (skills.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          {searchActive
            ? "No skills match your search."
            : "No skills in this view yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="border-border/80 border-b-border/40 bg-muted/80 overflow-hidden rounded-lg border shadow-2xs">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead
              className="w-[220px]"
              label="Name"
              onSortChange={onSortChange}
              sort={sort}
              sortKey="name"
            />
            <TableHead className={HEADER_CLASS}>Description</TableHead>
            <SortableHead
              className="w-[110px]"
              label="Type"
              onSortChange={onSortChange}
              sort={sort}
              sortKey="type"
            />
            <SortableHead
              className="w-[130px]"
              label="Updated"
              onSortChange={onSortChange}
              sort={sort}
              sortKey="updatedAt"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {skills.map((skill) => {
            const href = `/${slug}/skills/${skill.name}`;
            const updatedAt = new Date(skill.updatedAt);
            return (
              <TableRow
                className="cursor-pointer"
                key={skill.id}
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    router.push(href);
                  }
                }}
                onMouseEnter={() => router.prefetch(href)}
                tabIndex={0}
              >
                <TableCell className="py-3">
                  <span className="block truncate font-mono text-sm font-medium">
                    {skill.name}
                  </span>
                </TableCell>
                <TableCell className="max-w-0">
                  <span
                    className="text-muted-foreground block truncate text-sm"
                    title={skill.description}
                  >
                    {skill.description}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={skill.isSystem ? "secondary" : "outline"}>
                    {skill.isSystem
                      ? SKILL_TYPE_LABELS.system
                      : SKILL_TYPE_LABELS.custom}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <time
                    dateTime={updatedAt.toISOString()}
                    title={updatedAt.toLocaleString("en-US")}
                  >
                    {formatSkillUpdatedAt(updatedAt)}
                  </time>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
