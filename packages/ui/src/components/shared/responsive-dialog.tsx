"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@notra/ui/components/ui/dialog";
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

function ResponsiveDialog({ ...props }: React.ComponentProps<typeof Dialog>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Sheet {...props} />;
  }

  return <Dialog {...props} />;
}

function ResponsiveDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetTrigger {...props} />;
  }

  return <DialogTrigger {...props} />;
}

function ResponsiveDialogClose({
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetClose {...props} />;
  }

  return <DialogClose {...props} />;
}

type ResponsiveDialogContentProps = React.ComponentProps<typeof DialogContent> & {
  drawerClassName?: string;
};

function ResponsiveDialogContent({
  className,
  drawerClassName,
  ...props
}: ResponsiveDialogContentProps) {
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

  return <DialogContent className={className} {...props} />;
}

function ResponsiveDialogHeader({
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetHeader {...props} />;
  }

  return <DialogHeader {...props} />;
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <SheetFooter
        className={cn("[&_[data-slot=button]]:justify-center", className)}
        {...props}
      />
    );
  }

  return <DialogFooter className={className} {...props} />;
}

function ResponsiveDialogTitle({
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetTitle {...props} />;
  }

  return <DialogTitle {...props} />;
}

function ResponsiveDialogDescription({
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SheetDescription {...props} />;
  }

  return <DialogDescription {...props} />;
}

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogClose,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};
