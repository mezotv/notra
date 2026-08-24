"use client";

import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@notra/ui/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import { useState } from "react";
import { GeoProjectCreateDialog } from "@/components/geo/project-create-dialog";
import { ProjectLogo } from "@/components/geo/project-logo";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { useBrandSettings } from "@/lib/hooks/use-brand-analysis";
import { useGeoProjects } from "@/lib/hooks/use-geo";
import { useGeoProjectQueryState } from "@/lib/hooks/use-geo-project-query";
import { getWebsiteDomain } from "@/utils/brand";

export function GeoTopbarProjectSwitcher() {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id ?? "";
  const [projectParam, setProjectParam] = useGeoProjectQueryState();
  const [createOpen, setCreateOpen] = useState(false);

  const { data } = useGeoProjects(organizationId);
  const { data: brandData } = useBrandSettings(organizationId);
  const projects = data?.projects ?? [];
  const voices = brandData?.voices ?? [];

  const activeProject =
    projects.find((project) => project.id === projectParam) ??
    projects.at(0) ??
    null;

  const projectDomain = (brandSettingsId: string) =>
    getWebsiteDomain(
      voices.find((voice) => voice.id === brandSettingsId)?.websiteUrl ?? null
    );

  if (projects.length === 0 || !activeProject) {
    return null;
  }

  return (
    <>
      <BreadcrumbSeparator>
        <HugeiconsIcon icon={ArrowRight01Icon} />
      </BreadcrumbSeparator>
      <BreadcrumbItem className="min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="-mx-2 flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-0.5 font-normal text-foreground outline-none transition-colors hover:bg-accent data-popup-open:bg-accent"
                type="button"
              >
                <ProjectLogo
                  domain={projectDomain(activeProject.brandSettingsId)}
                  name={activeProject.name}
                />
                <span className="truncate">{activeProject.name}</span>
                <HugeiconsIcon
                  className="size-3.5 shrink-0 text-muted-foreground"
                  icon={ArrowDown01Icon}
                />
              </button>
            }
          />
          <DropdownMenuContent
            align="start"
            className="min-w-52 rounded-lg"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Projects</DropdownMenuLabel>
              {projects.map((project) => (
                <DropdownMenuItem
                  className="cursor-pointer gap-2 pr-8"
                  key={project.id}
                  onClick={() => setProjectParam(project.id)}
                >
                  <ProjectLogo
                    domain={projectDomain(project.brandSettingsId)}
                    name={project.name}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {project.name}
                  </span>
                  {activeProject.id === project.id ? (
                    <HugeiconsIcon
                      className="absolute right-2 size-4 text-muted-foreground"
                      icon={Tick02Icon}
                    />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <HugeiconsIcon icon={PlusSignIcon} />
              New project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <GeoProjectCreateDialog
        onCreated={(projectId) => setProjectParam(projectId)}
        onOpenChange={setCreateOpen}
        open={createOpen}
        organizationId={organizationId}
      />
    </>
  );
}
