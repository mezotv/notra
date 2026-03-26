"use client";

import OrbitImages from "@notra/ui/components/OrbitImages";
import { Databuddy } from "@notra/ui/components/ui/svgs/databuddy";
import { Framer } from "@notra/ui/components/ui/svgs/framer";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Marble } from "@notra/ui/components/ui/svgs/marble";
import { Slack } from "@notra/ui/components/ui/svgs/slack";
import { Webflow } from "@notra/ui/components/ui/svgs/webflow";
import { NotraMark } from "./notra-mark";

const items = [
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="github"
  >
    <Github className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="linear"
  >
    <Linear className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="slack"
  >
    <Slack className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="databuddy"
  >
    <Databuddy className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="framer"
  >
    <Framer className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="marble"
  >
    <Marble className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background shadow-sm"
    key="webflow"
  >
    <Webflow className="h-6 w-6" />
  </div>,
];

const centerLogo = (
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-primary shadow-md dark:bg-[#f3eeea]">
    <NotraMark className="h-7 w-7 shrink-0" />
  </div>
);

interface IntegrationOrbitProps {
  className?: string;
}

export default function IntegrationOrbit({
  className = "",
}: IntegrationOrbitProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="aspect-square h-full">
        <OrbitImages
          baseWidth={400}
          centerContent={centerLogo}
          direction="normal"
          duration={25}
          fill
          itemSize={52}
          items={items}
          pathColor="color-mix(in srgb, var(--border) 60%, transparent)"
          pathWidth={1}
          paused={false}
          radius={150}
          responsive
          rotation={0}
          shape="circle"
          showPath
        />
      </div>
    </div>
  );
}
