"use client";

import { toggleScope } from "@/lib/roles/scopes";
import type { RoleScopePickerProps } from "@/types/settings/roles";

export function RoleScopePicker({
  groups,
  value,
  onValueChange,
  disabled,
}: RoleScopePickerProps) {
  const selected = new Set(value);

  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/80 bg-background">
      {groups.map((group) => (
        <div className="px-3 py-2.5" key={group.resource}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {group.label}
          </p>
          <div className="mt-1.5 space-y-0.5">
            {group.scopes.map((scope) => (
              <label
                className="flex cursor-pointer items-start gap-2.5 rounded-md p-1.5 hover:bg-muted/60"
                key={scope.scope}
              >
                <input
                  checked={selected.has(scope.scope)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  disabled={disabled}
                  onChange={() =>
                    onValueChange(toggleScope(value, scope.scope))
                  }
                  type="checkbox"
                />
                <span className="min-w-0">
                  <span className="block font-medium text-sm leading-tight">
                    {scope.label}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground text-xs">
                    {scope.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
