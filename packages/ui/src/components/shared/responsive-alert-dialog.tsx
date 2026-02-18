"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@notra/ui/components/ui/alert-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@notra/ui/components/ui/sheet";
import { useIsMobile } from "@notra/ui/hooks/use-mobile";
import { cn } from "@notra/ui/lib/utils";
import type * as React from "react";

function ResponsiveAlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialog>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Sheet {...props} />;
  }

  return <AlertDialog {...props} />;
}

function ResponsiveAlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogTrigger>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetTrigger {...props} />;
  }

  return <AlertDialogTrigger {...props} />;
}

type ResponsiveAlertDialogContentProps = React.ComponentProps<
  typeof AlertDialogContent
> & {
  drawerClassName?: string;
};

function ResponsiveAlertDialogContent({
  className,
  drawerClassName,
  size,
  ...props
}: ResponsiveAlertDialogContentProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetContent
        className={cn(
          "h-auto max-h-[85svh] rounded-t-xl border-x-0 border-b-0 data-[side=bottom]:w-full data-[side=bottom]:!max-w-none [&>*:not([data-slot=sheet-header]):not([data-slot=sheet-footer]):not([data-slot=sheet-close])]:px-4 [&_[data-slot=sheet-header]]:pr-12",
          className,
          drawerClassName
        )}
        side="bottom"
        {...props}
      />
    );
  }

  return <AlertDialogContent className={className} size={size} {...props} />;
}

function ResponsiveAlertDialogHeader({
  ...props
}: React.ComponentProps<typeof AlertDialogHeader>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetHeader {...props} />;
  }

  return <AlertDialogHeader {...props} />;
}

function ResponsiveAlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogFooter>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetFooter
        className={cn("[&_[data-slot=button]]:justify-center", className)}
        {...props}
      />
    );
  }

  return <AlertDialogFooter className={className} {...props} />;
}

function ResponsiveAlertDialogTitle({
  ...props
}: React.ComponentProps<typeof AlertDialogTitle>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetTitle {...props} />;
  }

  return <AlertDialogTitle {...props} />;
}

function ResponsiveAlertDialogDescription({
  ...props
}: React.ComponentProps<typeof AlertDialogDescription>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetDescription {...props} />;
  }

  return <AlertDialogDescription {...props} />;
}

function ResponsiveAlertDialogMedia({
  ...props
}: React.ComponentProps<typeof AlertDialogMedia>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <div {...props} />;
  }

  return <AlertDialogMedia {...props} />;
}

function ResponsiveAlertDialogAction({
  ...props
}: React.ComponentProps<typeof AlertDialogAction>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Button {...props} />;
  }

  return <AlertDialogAction {...props} />;
}

function ResponsiveAlertDialogCancel({
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogCancel>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetClose
        render={<Button size={size} variant={variant} />}
        {...props}
      />
    );
  }

  return <AlertDialogCancel size={size} variant={variant} {...props} />;
}

export {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogMedia,
  ResponsiveAlertDialogTitle,
  ResponsiveAlertDialogTrigger,
};
