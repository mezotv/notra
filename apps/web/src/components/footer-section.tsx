"use client";

import { cn } from "@notra/ui/lib/utils";
import { Dithering } from "@paper-design/shaders-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import {
  FOOTER_DITHERING,
  FOOTER_LEGAL_LINKS,
  FOOTER_LINK_COLUMNS,
  FOOTER_SOCIAL_LINKS,
  FOOTER_TAGLINE,
} from "@/constants/landing/footer";
import type { FooterLink } from "@/types/landing/footer";
import { NotraMark } from "./notra-mark";

const LINK_CLASS =
  "font-medium font-sans text-[#1e1e1e99] text-base leading-6 tracking-[-0.01em] transition-colors hover:text-[#8b5cf6] dark:text-foreground/60 dark:hover:text-[#a78bfa]";

function FooterColumnLink({ link }: { link: FooterLink }) {
  if (!link.href) {
    return (
      <span
        className={cn(
          "font-medium font-sans text-[#1e1e1e99] text-base leading-6 tracking-[-0.01em] dark:text-foreground/60"
        )}
      >
        {link.label}
      </span>
    );
  }

  return (
    <Link
      className={LINK_CLASS}
      href={link.href}
      rel={link.external ? "noopener noreferrer" : undefined}
      target={link.external ? "_blank" : undefined}
    >
      {link.label}
    </Link>
  );
}

export default function FooterSection() {
  const shouldReduceMotion = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden rounded-t-3xl bg-[linear-gradient(in_oklab_180deg,oklab(80.3%_0.045_-0.074/15%)_0%,oklab(71.8%_0.066_-0.109/50%)_100%)] pt-6 shadow-[0_0.0625rem_0.125rem_#28282814,0_0_0_0.0625rem_#ececec] dark:bg-[#141019] dark:bg-none dark:shadow-none">
      <div className="-z-10 pointer-events-none absolute inset-0 overflow-hidden">
        <Dithering
          className="absolute top-[8.8125rem] left-[-5.40625rem] h-[66.125rem] w-[calc(100%+10.8125rem)] min-w-[100.8125rem]"
          colorBack={FOOTER_DITHERING.colorBack}
          colorFront={FOOTER_DITHERING.colorFront}
          scale={FOOTER_DITHERING.scale}
          shape={FOOTER_DITHERING.shape}
          size={FOOTER_DITHERING.size}
          speed={shouldReduceMotion ? 0 : FOOTER_DITHERING.speed}
          type={FOOTER_DITHERING.type}
        />
      </div>

      <div className="-z-10 pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
        <Image
          alt=""
          aria-hidden="true"
          className="h-auto w-[135%] min-w-[60rem] max-w-none translate-y-[20%] dark:opacity-40"
          height={536}
          src="/marketing/landing/footer-wordmark.svg"
          width={1748}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[87rem] flex-col px-6 pb-36 md:px-8 md:pb-52">
        <div className="flex flex-col gap-12 py-7 lg:flex-row lg:items-start lg:justify-between lg:gap-24">
          <div className="flex w-full max-w-[18.5rem] flex-col gap-7">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-1">
                <NotraMark className="size-10.5 shrink-0" />
                <span className="font-display font-semibold text-[1.25rem] text-foreground leading-[1.14] tracking-[-0.015em]">
                  Notra
                </span>
              </div>
              <p className="font-medium font-sans text-[#1e1e1e99] text-base leading-6 tracking-[-0.01em] dark:text-foreground/70">
                {FOOTER_TAGLINE}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <Link
                  aria-label={`Visit Notra on ${social.label}`}
                  className="text-[#1e1e1e80] transition-colors hover:text-[#1e1e1e] dark:text-foreground/50 dark:hover:text-foreground"
                  href={social.href}
                  key={social.label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <social.Icon className="size-5 [&_path.fill-foreground]:fill-current" />
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {FOOTER_LEGAL_LINKS.map((link) => (
                  <Link
                    className="font-medium font-sans text-[#1e1e1e66] text-[0.8125rem] leading-[1.125rem] transition-colors hover:text-[#1e1e1e] dark:text-foreground/50 dark:hover:text-foreground"
                    href={link.href ?? "/"}
                    key={link.label}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="font-medium font-sans text-[#1e1e1e66] text-[0.8125rem] leading-[1.125rem] dark:text-foreground/50">
                {`© ${year} Notra, Inc.`}
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:w-auto lg:flex-1 lg:justify-items-end">
            {FOOTER_LINK_COLUMNS.map((column) => (
              <div
                className="flex flex-col gap-8"
                key={column.groups[0]?.title}
              >
                {column.groups.map((group) => (
                  <div className="flex flex-col gap-4" key={group.title}>
                    <h3 className="font-medium font-sans text-[#8b5cf6] text-base leading-6 tracking-[-0.01em] dark:text-[#a78bfa]">
                      {group.title}
                    </h3>
                    <ul className="flex flex-col gap-4.5">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <FooterColumnLink link={link} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
