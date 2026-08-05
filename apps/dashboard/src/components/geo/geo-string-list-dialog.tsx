"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import { Input } from "@notra/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { addUniqueValue, removeValue } from "@/lib/geo/string-list";
import type { GeoStringListDialogProps } from "@/types/geo";

export function GeoStringListDialog({
  open,
  onOpenChange,
  title,
  description,
  columnLabel,
  addPlaceholder,
  addLabel,
  emptyLabel,
  values,
  isPending,
  onSave,
  footer,
}: GeoStringListDialogProps) {
  const [items, setItems] = useState<string[]>(values);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) {
      setItems(values);
      setDraft("");
    }
  }, [open, values]);

  const handleAdd = () => {
    setItems((previous) => addUniqueValue(previous, draft));
    setDraft("");
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 md:px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{columnLabel}</TableHead>
                <TableHead className="w-16 text-right">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell
                    className="text-muted-foreground text-sm"
                    colSpan={2}
                  >
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item}>
                  <TableCell className="font-medium">{item}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      aria-label={`Remove ${item}`}
                      onClick={() =>
                        setItems((previous) => removeValue(previous, item))
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
          <div className="flex gap-2">
            <Input
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAdd();
                }
              }}
              placeholder={addPlaceholder}
              value={draft}
            />
            <Button
              disabled={draft.trim().length === 0}
              onClick={handleAdd}
              variant="outline"
            >
              {addLabel}
            </Button>
          </div>
          {footer}
        </div>
        <ResponsiveDialogFooter>
          <Button disabled={isPending} onClick={() => onSave(items)}>
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Save
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
