import {
  Button as UiButton,
  buttonVariants as uiButtonVariants,
} from "@notra/ui/components/ui/button";
import { cn } from "@notra/ui/lib/utils";
import type { ComponentProps } from "react";

import { CTA_DESTRUCTIVE, CTA_OUTLINE, CTA_PRIMARY } from "@/constants/button";

function isDefaultVariant(variant: ComponentProps<typeof UiButton>["variant"]) {
  return variant === undefined || variant === "default";
}

function ctaClass(variant: ComponentProps<typeof UiButton>["variant"]) {
  if (isDefaultVariant(variant)) {
    return CTA_PRIMARY;
  }
  if (variant === "outline") {
    return CTA_OUTLINE;
  }
  if (variant === "destructive") {
    return CTA_DESTRUCTIVE;
  }
  return null;
}

function Button({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof UiButton>) {
  return (
    <UiButton
      className={cn(ctaClass(variant), className)}
      variant={variant}
      {...props}
    />
  );
}

function buttonVariants({
  className,
  ...options
}: Parameters<typeof uiButtonVariants>[0] = {}) {
  return cn(uiButtonVariants(options), ctaClass(options.variant), className);
}

export { Button, buttonVariants };
