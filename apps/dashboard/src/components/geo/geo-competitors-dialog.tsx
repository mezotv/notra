"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { CompetitorLogo } from "@/components/geo/competitor-logo";
import { findCompetitorDomain } from "@/lib/geo/domain";
import {
  useGeoCompetitorDelete,
  useGeoCompetitors,
  useGeoCompetitorUpsert,
} from "@/lib/hooks/use-geo";
import type {
  CompetitorRowProps,
  GeoCompetitorsDialogProps,
} from "@/types/geo";

const COMPETITOR_COLUMNS = 4;

function CompetitorRow({
  competitor,
  domain,
  isPending,
  onSelect,
  onRemove,
}: CompetitorRowProps) {
  return (
    <TableRow
      aria-label={`Open ${competitor}`}
      className="cursor-pointer"
      onClick={() => onSelect(competitor)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(competitor);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <TableCell className="w-10">
        <CompetitorLogo domain={domain} name={competitor} />
      </TableCell>
      <TableCell className="font-medium">{competitor}</TableCell>
      <TableCell>
        {domain ? (
          <a
            className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
            href={`https://${domain}`}
            onClick={(event) => event.stopPropagation()}
            rel="noopener"
            target="_blank"
          >
            {domain}
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">Add site</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          aria-label={`Remove ${competitor}`}
          disabled={isPending}
          onClick={(event) => {
            event.stopPropagation();
            onRemove(competitor);
          }}
          size="icon"
          variant="ghost"
        >
          <HugeiconsIcon className="size-4" icon={Delete02Icon} />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function GeoCompetitorsDialog({
  open,
  onOpenChange,
  organizationId,
}: GeoCompetitorsDialogProps) {
  const [draft, setDraft] = useState("");
  const [domainDraft, setDomainDraft] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isPending } = useGeoCompetitors(organizationId);
  const upsert = useGeoCompetitorUpsert(organizationId);
  const remove = useGeoCompetitorDelete(organizationId);

  const competitors = data?.competitors ?? [];

  const handleAdd = () => {
    const name = draft.trim();
    if (name.length === 0) {
      return;
    }
    const website = domainDraft.trim();
    upsert.mutate({ name, domain: website.length === 0 ? null : website });
    setDraft("");
    setDomainDraft("");
  };

  const handleSelect = (competitor: string) => {
    setSelected(competitor);
    onOpenChange(false);
  };

  return (
    <>
      <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
        <ResponsiveDialogContent className="sm:max-w-2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Competitors</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Named competitors get called out in scans; unlisted brands are
              still detected automatically.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-4 px-4 md:px-0">
            <div className="flex gap-2">
              <Input
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="Competitor name"
                value={draft}
              />
              <Input
                aria-label="Competitor website"
                className="max-w-[12rem]"
                onChange={(event) => setDomainDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="example.com"
                value={domainDraft}
              />
              <Button
                disabled={draft.trim().length === 0 || upsert.isPending}
                onClick={handleAdd}
                variant="outline"
              >
                {upsert.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Add
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Competitor</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-16 text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending && (
                  <TableRow>
                    <TableCell colSpan={COMPETITOR_COLUMNS}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                )}
                {!isPending && competitors.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      colSpan={COMPETITOR_COLUMNS}
                    >
                      No competitors yet
                    </TableCell>
                  </TableRow>
                )}
                {competitors.map((competitor) => (
                  <CompetitorRow
                    competitor={competitor.name}
                    domain={competitor.domain}
                    isPending={remove.isPending}
                    key={competitor.id}
                    onRemove={(name) => remove.mutate({ name })}
                    onSelect={handleSelect}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
