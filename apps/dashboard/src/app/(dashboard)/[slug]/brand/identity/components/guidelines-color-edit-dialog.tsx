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
import { COLOR_ROLE_OPTIONS } from "@/constants/brand-guideline-ui";
import {
  useCreateGuidelineColor,
  useUpdateGuidelineColor,
} from "@/lib/hooks/use-brand-guidelines";
import type { GuidelinesColorEditDialogProps } from "@/types/brand-identity";
import type { BrandGuidelineColorRole } from "@/types/hooks/brand-guidelines";
import { toColorInputValue } from "@/utils/brand-guideline-display";

interface ColorDialogState {
  darkValue: string;
  lightValue: string;
  name: string;
  role: BrandGuidelineColorRole;
  usage: string;
}

function updateColorDialogState(
  state: ColorDialogState,
  next: Partial<ColorDialogState>
) {
  return { ...state, ...next };
}

export function GuidelinesColorEditDialog({
  color,
  presetRole,
  organizationId,
  voiceId,
  open,
  onOpenChange,
}: GuidelinesColorEditDialogProps) {
  const update = useUpdateGuidelineColor(organizationId, voiceId);
  const create = useCreateGuidelineColor(organizationId, voiceId);
  const isCreate = color === null;
  const [state, setState] = useReducer(updateColorDialogState, {
    darkValue: color?.darkValue ?? "",
    lightValue: color?.lightValue ?? "#000000",
    name: color?.name ?? "",
    role: color?.role ?? presetRole ?? "custom",
    usage: color?.usage ?? "",
  });
  const { darkValue, lightValue, name, role, usage } = state;
  const isPending = isCreate ? create.isPending : update.isPending;

  const handleSave = async () => {
    const payload = {
      role,
      name: name.trim() || null,
      lightValue: lightValue.trim(),
      darkValue: darkValue.trim() || null,
      usage: usage.trim() || null,
    };

    try {
      if (color) {
        await update.mutateAsync({ colorId: color.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(isCreate ? "Color added" : "Color updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save color"
      );
    }
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isCreate ? "Add color" : "Edit color"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isCreate
              ? "Add a brand color and how it is used."
              : "Update this brand color and how it is used."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="color-light-value">Light color</Label>
            <div className="flex items-center gap-2">
              <input
                aria-label="Light color picker"
                className="size-9 shrink-0 cursor-pointer rounded-lg border bg-transparent"
                onChange={(event) =>
                  setState({ lightValue: event.target.value })
                }
                type="color"
                value={toColorInputValue(lightValue)}
              />
              <Input
                id="color-light-value"
                onChange={(event) =>
                  setState({ lightValue: event.target.value })
                }
                placeholder="#000000"
                value={lightValue}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-dark-value">Dark color</Label>
            <div className="flex items-center gap-2">
              <input
                aria-label="Dark color picker"
                className="size-9 shrink-0 cursor-pointer rounded-lg border bg-transparent"
                onChange={(event) =>
                  setState({ darkValue: event.target.value })
                }
                type="color"
                value={toColorInputValue(darkValue || lightValue)}
              />
              <Input
                id="color-dark-value"
                onChange={(event) =>
                  setState({ darkValue: event.target.value })
                }
                placeholder="Optional dark value"
                value={darkValue}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-name">Name</Label>
            <Input
              id="color-name"
              onChange={(event) => setState({ name: event.target.value })}
              placeholder="Optional name"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              onValueChange={(next) => {
                const option = COLOR_ROLE_OPTIONS.find((o) => o.value === next);
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
                {COLOR_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-usage">Usage</Label>
            <Input
              id="color-usage"
              onChange={(event) => setState({ usage: event.target.value })}
              placeholder="e.g. Primary buttons"
              value={usage}
            />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={isPending} onClick={handleSave}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
