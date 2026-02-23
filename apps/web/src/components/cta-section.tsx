"use client";

import { Button } from "@notra/ui/components/ui/button";
import Link from "next/link";

export default function CTASection() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden">
      <div className="relative z-10 flex items-center justify-center gap-6 self-stretch border-primary/12 border-t border-b px-6 py-12 md:px-24 md:py-12">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <div className="relative h-full w-full">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                className="-rotate-45 absolute h-4 w-full origin-top-left outline outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                key={i}
                style={{
                  top: `${i * 16 - 120}px`,
                  left: "-100%",
                  width: "300%",
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-20 flex w-full max-w-[586px] flex-col items-center justify-start gap-6 overflow-hidden rounded-lg px-6 py-5 md:py-8">
          <div className="flex flex-col items-start justify-start gap-3 self-stretch">
            <div className="self-stretch text-balance text-center font-sans font-semibold text-3xl text-foreground leading-tight tracking-tight md:text-5xl md:leading-[56px]">
              Stop writing content{" "}
              <span className="text-primary">from scratch</span>
            </div>
            <div className="self-stretch text-center font-medium font-sans text-base text-muted-foreground leading-7">
              Let Notra turn your team's shipped work into changelogs,
              <br />
              blog posts, and social updates you can publish today.
            </div>
          </div>
          <div className="flex w-full max-w-[497px] flex-col items-center justify-center gap-12">
            <div className="flex items-center justify-start gap-4">
              <Button
                className="h-10 border-transparent bg-primary px-12 py-[6px] transition-colors hover:bg-primary-hover"
                nativeButton={false}
                render={<Link href="https://app.usenotra.com/signup" />}
              >
                <span className="flex flex-col justify-center font-medium font-sans text-[13px] text-primary-foreground leading-5">
                  Start for free
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
