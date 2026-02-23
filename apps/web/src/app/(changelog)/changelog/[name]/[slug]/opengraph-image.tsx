import { ImageResponse } from "next/og";
import { changelog } from "@/../.source/server";
import { changelogEntryParamsSchema } from "@/schemas/changelog";
import { getCompany } from "@/utils/changelog";
import type { ChangelogEntryOgImageProps } from "~types/changelog";
import { ChangelogOgTemplate } from "../../og-image-template";

export const alt = "Generated changelog entry preview image";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function truncate(value: string, max = 120) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 3)}...`;
}

export default async function Image({ params }: ChangelogEntryOgImageProps) {
  const parsedParams = changelogEntryParamsSchema.safeParse(await params);
  const name = parsedParams.success ? parsedParams.data.name : "project";
  const slug = parsedParams.success ? parsedParams.data.slug : "entry";
  const company = parsedParams.success ? getCompany(name) : null;
  const entry = parsedParams.success
    ? changelog.find((e) => e.info.path === `${name}/${slug}.mdx`)
    : null;

  const companyName = company?.name ?? "this project";
  const title = entry?.title ?? `${companyName} Changelog`;
  const subtitle = entry?.description ?? companyName;

  return new ImageResponse(
    <ChangelogOgTemplate
      companyName={companyName}
      showAccentDot={false}
      subtitle={truncate(subtitle, 220)}
      title={truncate(title, 74)}
    />,
    {
      ...size,
    }
  );
}
