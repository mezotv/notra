"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useReducer } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { FONT_ROLE_OPTIONS } from "@/constants/brand-guideline-ui";
import { useUpdateGuidelineFont } from "@/lib/hooks/use-brand-guidelines";
import type { GuidelinesFontEditDialogProps } from "@/types/brand-identity";
import type { BrandGuidelineFontRole } from "@/types/hooks/brand-guidelines";

interface FontDialogState {
  family: string;
  lineHeight: string;
  role: BrandGuidelineFontRole;
  size: string;
  weight: string;
}

function updateFontDialogState(
  state: FontDialogState,
  next: Partial<FontDialogState>
) {
  return { ...state, ...next };
}

export function GuidelinesFontEditDialog({
  font,
  organizationId,
  voiceId,
  open,
  onOpenChange,
}: GuidelinesFontEditDialogProps) {
  const update = useUpdateGuidelineFont(organizationId, voiceId);
  const [state, setState] = useReducer(updateFontDialogState, {
    family: font.family,
    lineHeight: font.lineHeight ?? "",
    role: font.role,
    size: font.size ?? "",
    weight: font.weight ?? "",
  });
  const { family, lineHeight, role, size, weight } = state;

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        fontId: font.id,
        role,
        family: family.trim(),
        weight: weight.trim() || null,
        size: size.trim() || null,
        lineHeight: lineHeight.trim() || null,
      });
      toast.success("Font updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update font"
      );
    }
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit font</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update this typeface and its role.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="font-family">Family</Label>
            <Input
              id="font-family"
              onChange={(event) => setState({ family: event.target.value })}
              placeholder="e.g. Inter"
              value={family}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              onValueChange={(next) => {
                const option = FONT_ROLE_OPTIONS.find((o) => o.value === next);
                if (option) {
                  setState({ role: option.value });
                }
              }}
              value={role}
            >
              <SelectTrigger>
                <SelectValue className="capitalize" />
              </SelectTrigger>
              <SelectContent>
                {FONT_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="font-weight">Weight</Label>
              <Input
                id="font-weight"
                onChange={(event) => setState({ weight: event.target.value })}
                placeholder="400"
                value={weight}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="font-size">Size</Label>
              <Input
                id="font-size"
                onChange={(event) => setState({ size: event.target.value })}
                placeholder="16px"
                value={size}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="font-line-height">Line height</Label>
              <Input
                id="font-line-height"
                onChange={(event) =>
                  setState({ lineHeight: event.target.value })
                }
                placeholder="1.5"
                value={lineHeight}
              />
            </div>
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button
            disabled={update.isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={update.isPending} onClick={handleSave}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
