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
import { MARKETING_NAV_LINKS } from "@/utils/navigation";
import { HatchPattern } from "./hatch-pattern";
import { NotraMark, notraMarkSvgString } from "./notra-mark";
import { ThemeToggle } from "./theme-toggle";
import { TrackedSignupLink } from "./tracked-signup-link";

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
          <HatchPattern className="w-4 sm:w-6 md:w-8 lg:w-12" />

          <div className="relative flex min-w-0 flex-1 items-center justify-between border-border border-r border-l bg-background/80 px-3 backdrop-blur-sm sm:px-4 md:px-5">
            <div className="z-10 flex min-w-0 items-center justify-center">
              <DropdownMenu
                onOpenChange={(open) => {
                  if (!open) {
                    setLogoMenuOpen(false);
                  }
                }}
                open={logoMenuOpen}
              >
                <DropdownMenuTrigger
                  nativeButton={false}
                  render={
                    <Link
                      className="flex cursor-pointer items-center justify-start gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-primary"
                      href="/"
                      onClick={(e) => {
                        const event = e as React.MouseEvent & {
                          preventBaseUIHandler?: () => void;
                        };
                        event.preventBaseUIHandler?.();
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setLogoMenuOpen((prev) => !prev);
                      }}
                    />
                  }
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-transparent p-1 dark:bg-[#f3eeea]">
                    <NotraMark className="h-7 w-7 shrink-0" />
                  </div>
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
            </div>
            <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-2 sm:flex sm:gap-3 md:gap-4 lg:gap-4">
              {MARKETING_NAV_LINKS.map((link) => (
                <Link
                  className="pointer-events-auto flex items-center justify-start"
                  href={link.href}
                  key={link.href}
                >
                  <div className="flex flex-col justify-center font-medium font-sans text-foreground/80 text-xs leading-[14px] transition-colors hover:text-foreground md:text-[13px]">
                    {link.label}
                  </div>
                </Link>
              ))}
            </div>
            <div className="z-10 hidden h-6 items-center justify-start gap-2 sm:flex sm:h-7 sm:gap-3 md:h-8">
              <ThemeToggle />
              <Link href="https://app.usenotra.com/login">
                <Button
                  className="overflow-hidden rounded-lg border-transparent bg-card px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-muted sm:px-3 sm:py-[6px] md:px-[14px]"
                  variant="ghost"
                >
                  <span className="flex flex-col justify-center font-medium font-sans text-primary text-xs leading-5 md:text-[13px]">
                    Log in
                  </span>
                </Button>
              </Link>
              <TrackedSignupLink source="navbar_desktop_signup">
                <Button className="overflow-hidden rounded-lg border-transparent bg-primary px-2 py-1 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-primary-hover sm:px-3 sm:py-[6px] md:px-[14px]">
                  <span className="flex flex-col justify-center font-medium font-sans text-primary-foreground text-xs leading-5 md:text-[13px]">
                    Sign up
                  </span>
                </Button>
              </TrackedSignupLink>
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

          <HatchPattern className="w-4 sm:w-6 md:w-8 lg:w-12" />
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-15 flex flex-col items-center justify-center gap-6 bg-background px-8 sm:hidden">
          <nav className="flex flex-col items-center gap-6">
            {MARKETING_NAV_LINKS.map((link) => (
              <Link
                className="font-medium font-sans text-foreground text-lg"
                href={link.href}
                key={link.href}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-3">
            <ThemeToggle />
            <TrackedSignupLink
              onClick={() => setIsOpen(false)}
              source="navbar_mobile_signup"
            >
              <Button className="h-11 overflow-hidden rounded-lg border-transparent bg-primary px-8 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-primary-hover">
                <span className="font-medium font-sans text-base text-primary-foreground">
                  Sign up
                </span>
              </Button>
            </TrackedSignupLink>
            <Link href="https://app.usenotra.com/login">
              <Button
                className="h-11 overflow-hidden rounded-lg border-transparent bg-card px-8 shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-muted"
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
