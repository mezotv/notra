"use client";

import OrbitImages from "@notra/ui/components/OrbitImages";
import { Framer } from "@notra/ui/components/ui/svgs/framer";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Marble } from "@notra/ui/components/ui/svgs/marble";
import { Slack } from "@notra/ui/components/ui/svgs/slack";
import { Webflow } from "@notra/ui/components/ui/svgs/webflow";
import Image from "next/image";
import { NotraMark } from "./notra-mark";

const items = [
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="github"
  >
    <Github className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="linear"
  >
    <Linear className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="slack"
  >
    <Slack className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="databuddy"
  >
    <Image
      alt="DataBuddy"
      className="h-6 w-6"
      height={24}
      src="/logos/brands/databuddy.svg"
      width={24}
    />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="framer"
  >
    <Framer className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="marble"
  >
    <Marble className="h-6 w-6" />
  </div>,
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
    key="webflow"
  >
    <Webflow className="h-6 w-6" />
  </div>,
];

const centerLogo = (
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-primary shadow-md">
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
          pathColor="rgba(0,0,0,0.06)"
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
