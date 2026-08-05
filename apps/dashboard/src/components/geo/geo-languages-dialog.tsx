"use client";

import { Delete02Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SUPPORTED_LANGUAGES } from "@notra/ai/constants/languages";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@notra/ui/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GEO_LANGUAGE_FLAGS, GEO_MAX_LANGUAGES } from "@/constants/geo";
import { removeValue } from "@/lib/geo/string-list";
import { useGeoSettingsUpsert } from "@/lib/hooks/use-geo";
import { cn } from "@/lib/utils";
import type { GeoSubDialogProps } from "@/types/geo";

const SELECTABLE_LANGUAGES = SUPPORTED_LANGUAGES.filter(
  (language) => language !== "English"
);

export function GeoLanguagesDialog({
  open,
  onOpenChange,
  organizationId,
  settings,
  companyName,
  enabled,
}: GeoSubDialogProps) {
  const upsert = useGeoSettingsUpsert(organizationId);
  const saved = useMemo(() => settings?.languages ?? [], [settings]);
  const [selected, setSelected] = useState<string[]>(saved);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSelected(saved);
      setSearch("");
    }
  }, [open, saved]);

  const atLimit = selected.length >= GEO_MAX_LANGUAGES;
  const query = search.trim().toLowerCase();
  const results = SELECTABLE_LANGUAGES.filter(
    (language) =>
      !selected.includes(language) && language.toLowerCase().includes(query)
  );

  const handleSave = () => {
    upsert.mutate(
      {
        organizationId,
        companyName: companyName.trim(),
        aliases: settings?.aliases ?? [],
        competitors: settings?.competitors ?? [],
        languages: selected,
        enabled,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Languages</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Each scan also asks the engines in these languages so you can see
            how you perform beyond English.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 md:px-0">
          <div className="border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Selected ({selected.length}/{GEO_MAX_LANGUAGES})
                  </TableHead>
                  <TableHead className="w-16 text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="text-muted-foreground text-sm"
                      colSpan={2}
                    >
                      English only
                    </TableCell>
                  </TableRow>
                )}
                {selected.map((language) => (
                  <TableRow key={language}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span aria-hidden="true">
                          {GEO_LANGUAGE_FLAGS[language]}
                        </span>
                        {language}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        aria-label={`Remove ${language}`}
                        onClick={() =>
                          setSelected((previous) =>
                            removeValue(previous, language)
                          )
                        }
                        size="icon"
                        variant="ghost"
                      >
                        <HugeiconsIcon className="size-4" icon={Delete02Icon} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-2">
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon className="size-4" icon={Search01Icon} />
              </InputGroupAddon>
              <InputGroupInput
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search languages"
                value={search}
              />
            </InputGroup>
            {atLimit ? (
              <p className="text-muted-foreground text-xs">
                Remove a language to pick another one.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto border">
                {results.length === 0 && (
                  <p className="p-3 text-muted-foreground text-sm">
                    No languages match "{search.trim()}"
                  </p>
                )}
                {results.map((language) => (
                  <button
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0",
                      "hover:bg-muted/50"
                    )}
                    key={language}
                    onClick={() =>
                      setSelected((previous) => [...previous, language])
                    }
                    type="button"
                  >
                    <span aria-hidden="true">
                      {GEO_LANGUAGE_FLAGS[language]}
                    </span>
                    {language}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button disabled={upsert.isPending} onClick={handleSave}>
            {upsert.isPending && (
              <Loader2Icon className="size-4 animate-spin" />
            )}
            Save
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
