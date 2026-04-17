"use client";

import { Label } from "@notra/ui/components/ui/label";
import { Switch } from "@notra/ui/components/ui/switch";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useHidePersonalData } from "@/lib/hooks/use-privacy-preferences";

export function PrivacySection() {
  const { hidePersonalData, hasHydrated, isUpdating, setHidePersonalData } =
    useHidePersonalData();

  return (
    <TitleCard className="lg:col-span-2" heading="Privacy">
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Control how your personal information is displayed
        </p>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="min-w-0 space-y-1">
            <Label
              className="cursor-pointer font-medium text-sm"
              htmlFor="hide-personal-data"
            >
              Hide personal data
            </Label>
            <p className="text-muted-foreground text-xs">
              Blur your email and name in the sidebar. Useful when sharing your
              screen.
            </p>
          </div>
          <Switch
            checked={hidePersonalData}
            disabled={!hasHydrated || isUpdating}
            id="hide-personal-data"
            onCheckedChange={setHidePersonalData}
          />
        </div>
      </div>
    </TitleCard>
  );
}
