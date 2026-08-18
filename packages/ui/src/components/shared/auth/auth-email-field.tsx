"use client";

import type { AuthEmailFieldProps } from "../../../lib/auth-types";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

export function AuthEmailField({
  id,
  label,
  value,
  error,
  disabled,
  placeholder,
  onBlur,
  onChange,
}: AuthEmailFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={`${id}-error`}
        aria-invalid={Boolean(error)}
        autoComplete="email"
        className="h-11 rounded-xl px-4"
        disabled={disabled}
        id={id}
        name={id}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="email"
        value={value}
      />
      <p
        aria-live="polite"
        className="min-h-5 text-destructive text-sm"
        id={`${id}-error`}
      >
        {error}
      </p>
    </div>
  );
}
