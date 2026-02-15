import { ImageResponse } from "next/og";
import { changelogCompanyParamsSchema } from "@/schemas/changelog";
import { getCompany } from "@/utils/changelog";
import type { ChangelogCompanyOgImageProps } from "~types/changelog";
import { ChangelogOgTemplate } from "../og-image-template";

export const alt = "Example changelog preview image";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: ChangelogCompanyOgImageProps) {
  const parsedParams = changelogCompanyParamsSchema.safeParse(await params);
  const name = parsedParams.success ? parsedParams.data.name : "project";
  const company = parsedParams.success ? getCompany(name) : null;

  const companyName = company?.name ?? "Project";
  const subtitle = company?.description ?? companyName;

  return new ImageResponse(
    <ChangelogOgTemplate
      companyName={companyName}
      subtitle={subtitle}
      title={`${companyName}.`}
    />,
    {
      ...size,
    }
  );
}
