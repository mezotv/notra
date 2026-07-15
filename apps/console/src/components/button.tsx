import {
  Button as UiButton,
  buttonVariants as uiButtonVariants,
} from "@notra/ui/components/ui/button";
import { cn } from "@notra/ui/lib/utils";
import type { ComponentProps } from "react";

const CTA_PRIMARY =
  "corner-squircle rounded-[1rem] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] hover:bg-primary/90 supports-[corner-shape:round]:rounded-[1.25rem]";

function isDefaultVariant(variant: ComponentProps<typeof UiButton>["variant"]) {
  return variant === undefined || variant === "default";
}

function Button({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof UiButton>) {
  return (
    <UiButton
      className={cn(isDefaultVariant(variant) && CTA_PRIMARY, className)}
      variant={variant}
      {...props}
    />
  );
}

function buttonVariants({
  className,
  ...options
}: Parameters<typeof uiButtonVariants>[0] = {}) {
  return cn(
    uiButtonVariants(options),
    isDefaultVariant(options.variant) && CTA_PRIMARY,
    className
  );
}

export { Button, buttonVariants };
