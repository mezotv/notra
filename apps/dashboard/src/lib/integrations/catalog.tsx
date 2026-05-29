"use client";

import { Framer } from "@notra/ui/components/ui/svgs/framer";
import { Github } from "@notra/ui/components/ui/svgs/github";
import { Linear } from "@notra/ui/components/ui/svgs/linear";
import { Raycast } from "@notra/ui/components/ui/svgs/raycast";
import type { IntegrationConfig } from "@/types/integrations/catalog";

export const INPUT_SOURCES: readonly IntegrationConfig[] = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Connect GitHub repositories for AI-powered changelogs, blog posts, and tweets",
    icon: <Github />,
    accentColor: "#238636",
    href: "github",
    available: true,
    category: "input",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Sync issues and updates from Linear for automated content",
    icon: <Linear />,
    accentColor: "#5E6AD2",
    href: "linear",
    available: true,
    category: "input",
  },
];

const OUTPUT_SOURCES: readonly IntegrationConfig[] = [
  {
    id: "framer",
    name: "Framer",
    description: "Import content into Framer automatically",
    icon: <Framer />,
    accentColor: "#0055FF",
    href: "framer",
    available: true,
    category: "output",
  },
];

const EXTENSION_SOURCES: readonly IntegrationConfig[] = [
  {
    id: "raycast",
    name: "Raycast",
    description: "Quickly access and search your Notra content from Raycast",
    icon: <Raycast />,
    accentColor: "#FF6363",
    href: "raycast",
    available: true,
    category: "extension",
    connectLabel: "Setup Guide",
  },
];

export const ALL_INTEGRATIONS = [
  ...INPUT_SOURCES,
  ...OUTPUT_SOURCES,
  ...EXTENSION_SOURCES,
];
