"use client";

import { Cancel01Icon, Menu02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NotraMark, notraMarkSvgString } from "./notra-mark";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [logoMenuOpen, setLogoMenuOpen] = useState(false);

  const handleCopySvg = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(notraMarkSvgString);
      setLogoMenuOpen(false);
      toast.success("Copied logo SVG to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div className="absolute top-0 left-0 z-20 flex h-14 w-full items-center justify-center border-border border-b sm:h-14 md:h-16 lg:h-[84px]">
        <div className="relative z-30 flex h-full w-full min-w-[320px] items-stretch justify-center">
          <div className="relative w-4 overflow-hidden sm:w-6 md:w-8 lg:w-12">
            <div className="-top-24 -left-10 sm:-left-12.5 md:-left-14.5 absolute flex w-30 flex-col items-start justify-start sm:w-35 md:w-40.5">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                  key={`left-rail-${i}`}
                />
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-between border-border border-r border-l bg-background/80 px-3 backdrop-blur-sm sm:px-4 md:px-5">
            <div className="flex min-w-0 items-center justify-center">
              <DropdownMenu
                onOpenChange={(open) => {
                  if (!open) {
                    setLogoMenuOpen(false);
                  }
                }}
                open={logoMenuOpen}
              >
                <DropdownMenuTrigger
                  className="flex cursor-pointer items-center justify-start gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-primary"
                  nativeButton={false}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setLogoMenuOpen((prev) => !prev);
                  }}
                  render={<Link href="/" />}
                >
                  <NotraMark className="h-7 w-7 shrink-0" />
                  <div className="flex flex-col justify-center font-medium font-sans text-foreground text-sm leading-5 sm:text-base md:text-lg lg:text-xl">
                    Notra
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-48"
                  side="bottom"
                  sideOffset={8}
                >
                  <DropdownMenuItem onClick={handleCopySvg}>
                    <NotraMark className="size-4" />
                    Copy Logo as SVG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="hidden items-start justify-start gap-2 pl-3 sm:flex sm:gap-3 sm:pl-4 md:gap-4 md:pl-5 lg:gap-4 lg:pl-5">
                <Link
                  className="flex items-center justify-start"
                  href="/#features"
                >
                  <div className="flex flex-col justify-center font-medium font-sans text-foreground/80 text-xs leading-[14px] transition-colors hover:text-foreground md:text-[13px]">
                    Features
                  </div>
                </Link>
                <Link
                  className="flex items-center justify-start"
                  href="/#pricing"
                >
                  <div className="flex flex-col justify-center font-medium font-sans text-foreground/80 text-xs leading-[14px] transition-colors hover:text-foreground md:text-[13px]">
                    Pricing
                  </div>
                </Link>
                <Link
                  className="flex items-center justify-start"
                  href="/changelog"
                >
                  <div className="flex flex-col justify-center font-medium font-sans text-foreground/80 text-xs leading-[14px] transition-colors hover:text-foreground md:text-[13px]">
                    Showcase
                  </div>
                </Link>
              </div>
            </div>
            <div className="hidden h-6 items-start justify-start gap-2 sm:flex sm:h-7 sm:gap-3 md:h-8">
              <Link href="https://app.usenotra.com/login">
                <Button
                  className="overflow-hidden rounded-lg border-transparent bg-white px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-muted sm:px-3 sm:py-[6px] md:px-[14px]"
                  variant="ghost"
                >
                  <span className="flex flex-col justify-center font-medium font-sans text-primary text-xs leading-5 md:text-[13px]">
                    Log in
                  </span>
                </Button>
              </Link>
              <Link href="https://app.usenotra.com/signup">
                <Button className="overflow-hidden rounded-lg border-transparent bg-primary px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-primary-hover sm:px-3 sm:py-[6px] md:px-[14px]">
                  <span className="flex flex-col justify-center font-medium font-sans text-primary-foreground text-xs leading-5 md:text-[13px]">
                    Sign up
                  </span>
                </Button>
              </Link>
            </div>
            <button
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="flex items-center justify-center sm:hidden"
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
              <HugeiconsIcon
                className="text-foreground"
                icon={isOpen ? Cancel01Icon : Menu02Icon}
                size={20}
              />
            </button>
          </div>

          <div className="relative w-4 overflow-hidden sm:w-6 md:w-8 lg:w-12">
            <div className="-left-10 -top-24 sm:-left-12.5 md:-left-14.5 absolute flex w-30 flex-col items-start justify-start sm:w-35 md:w-40.5">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  className="-rotate-45 h-3 origin-top-left self-stretch outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px] sm:h-4"
                  key={`right-rail-${i}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-15 flex flex-col items-center justify-center gap-6 bg-background px-8 sm:hidden">
          <nav className="flex flex-col items-center gap-6">
            <Link
              className="font-medium font-sans text-foreground text-lg"
              href="/#features"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              className="font-medium font-sans text-foreground text-lg"
              href="/#pricing"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            <Link
              className="font-medium font-sans text-foreground text-lg"
              href="/changelog"
              onClick={() => setIsOpen(false)}
            >
              Showcase
            </Link>
          </nav>
          <div className="flex flex-col items-center gap-3">
            <Link href="https://app.usenotra.com/signup">
              <Button className="h-11 overflow-hidden rounded-lg border-transparent bg-primary px-8 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-primary-hover">
                <span className="font-medium font-sans text-base text-primary-foreground">
                  Sign up
                </span>
              </Button>
            </Link>
            <Link href="https://app.usenotra.com/login">
              <Button
                className="h-11 overflow-hidden rounded-lg border-transparent bg-white px-8 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-muted"
                variant="ghost"
              >
                <span className="font-medium font-sans text-base text-primary">
                  Log in
                </span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
