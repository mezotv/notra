"use client";

import type { ReactNode } from "react";
import { cn } from "@notra/ui/lib/utils";
import {
  PermissionOption,
  type PermissionOptionProps,
} from "./permission-option";
import { PermissionRow, type PermissionRowProps } from "./permission-row";
import type { PermissionTone } from "./permission-selector-context";

export interface PermissionSelectorProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

function PermissionSelector({
  children,
  label = "Permissions",
  className,
}: PermissionSelectorProps) {
  return (
    <fieldset
      className={cn(
        "w-full divide-y overflow-hidden rounded-xl border bg-background",
        className
      )}
    >
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

export { PermissionSelector, PermissionRow, PermissionOption };
export type { PermissionRowProps, PermissionOptionProps, PermissionTone };
