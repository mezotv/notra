import type { ReactNode } from "react";

interface AssetTileProps {
  title: string;
  badge: string;
  spinner: ReactNode;
  badgeIcon: ReactNode;
  barOpacities: [string, string, string];
  wrapperClassName: string;
}

function AssetTile({
  title,
  badge,
  spinner,
  badgeIcon,
  barOpacities,
  wrapperClassName,
}: AssetTileProps) {
  return (
    <div
      className={`absolute flex flex-col rounded-lg border border-[#E5E5E5CC] bg-[#F5F5F5] p-2 [box-shadow:#0000000D_0rem_0.125rem_1.25rem] ${wrapperClassName}`}
    >
      <div className="flex items-start justify-between gap-4 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          {spinner}
          <div className="line-clamp-1 font-sans text-[1.125rem] leading-[155.556%] font-medium text-[#737373]">
            {title}
          </div>
        </div>
      </div>
      <div className="grow basis-[0%] rounded-xl border border-[#E5E5E5CC] bg-white px-4 py-3">
        <div
          className={`mb-2 h-3.5 w-full rounded-md bg-[#F5F5F5] ${barOpacities[0]}`}
        />
        <div
          className={`mb-2 h-3.5 w-full rounded-md bg-[#F5F5F5] ${barOpacities[1]}`}
        />
        <div
          className={`h-3.5 w-2/3 rounded-md bg-[#F5F5F5] ${barOpacities[2]}`}
        />
      </div>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-clip rounded-4xl border border-[#E5E5E5] px-2 py-0.5">
          <div className="w-max shrink-0 font-sans text-[0.75rem] leading-[133.333%] font-medium text-[#171717] capitalize">
            draft
          </div>
        </div>
        <div className="flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-clip rounded-4xl border border-[#00000000] bg-[#F5F5F5] px-2 py-0.5">
          {badgeIcon}
          <div className="inline-block w-max shrink-0 font-sans text-[0.75rem] leading-[133.333%] font-medium text-[#171717] capitalize">
            {badge}
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner({ rotationClass }: { rotationClass: string }) {
  return (
    <svg
      className={`size-4 shrink-0 overflow-clip ${rotationClass}`}
      fill="none"
      stroke="#8B5CF6"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Generating</title>
      <path
        d="M21 12a9 9 0 1 1-6.219-8.56"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function FeaturesCardAssets() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <AssetTile
        badge="image"
        badgeIcon={
          <svg
            className="size-3 shrink-0 overflow-clip"
            fill="none"
            stroke="#171717"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Image</title>
            <circle cx="7.5" cy="7.5" r="1.5" strokeWidth="1.5" />
            <path
              d="M2.5 12C2.5 7.522 2.5 5.282 3.891 3.891C5.282 2.5 7.522 2.5 12 2.5C16.478 2.5 18.718 2.5 20.109 3.891C21.5 5.282 21.5 7.522 21.5 12C21.5 16.478 21.5 18.718 20.109 20.109C18.718 21.5 16.478 21.5 12 21.5C7.522 21.5 5.282 21.5 3.891 20.109C2.5 18.718 2.5 16.478 2.5 12Z"
              strokeWidth="1.5"
            />
            <path
              d="M5 21C9.372 15.775 14.274 8.884 21.497 13.542"
              strokeWidth="1.5"
            />
          </svg>
        }
        barOpacities={["opacity-[0.875]", "opacity-[0.892]", "opacity-[0.913]"]}
        spinner={<Spinner rotationClass="rotate-[201.178deg]" />}
        title="Generating image..."
        wrapperClassName="top-28.25 -left-12.75 h-43.5 w-66.75"
      />
      <AssetTile
        badge="blog post"
        badgeIcon={
          <svg
            className="size-3 shrink-0 overflow-clip"
            fill="none"
            stroke="#171717"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Blog post</title>
            <path
              d="M10.5 8H18.5M10.5 12H13M18.5 12H16M10.5 16H13M18.5 16H16"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M7 7.5H6C4.114 7.5 3.172 7.5 2.586 8.086C2 8.672 2 9.614 2 11.5V18C2 19.381 3.119 20.5 4.5 20.5C5.881 20.5 7 19.381 7 18V7.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M16 3.5H11C10.07 3.5 9.605 3.5 9.224 3.602C8.188 3.88 7.38 4.688 7.102 5.724C7 6.105 7 6.57 7 7.5V18C7 19.381 5.881 20.5 4.5 20.5H16C18.828 20.5 20.243 20.5 21.121 19.621C22 18.743 22 17.328 22 14.5V9.5C22 6.672 22 5.257 21.121 4.379C20.243 3.5 18.828 3.5 16 3.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        }
        barOpacities={["opacity-[0.501]", "opacity-[0.5]", "opacity-[0.5]"]}
        spinner={<Spinner rotationClass="rotate-[306.36deg]" />}
        title="Generating blog post..."
        wrapperClassName="top-28.25 left-56.75 h-43.5 w-65.75"
      />
      <AssetTile
        badge="changelog"
        badgeIcon={
          <svg
            className="size-3 shrink-0 overflow-clip"
            fill="none"
            stroke="#171717"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Changelog</title>
            <path
              d="M3.439 8.561C3.879 9 4.586 9 6 9C7.414 9 8.121 9 8.561 8.561C9 8.121 9 7.414 9 6C9 4.586 9 3.879 8.561 3.439C8.121 3 7.414 3 6 3C4.586 3 3.879 3 3.439 3.439C3 3.879 3 4.586 3 6C3 7.414 3 8.121 3.439 8.561Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M15.439 8.561C15.879 9 16.586 9 18 9C19.414 9 20.121 9 20.561 8.561C21 8.121 21 7.414 21 6C21 4.586 21 3.879 20.561 3.439C20.121 3 19.414 3 18 3C16.586 3 15.879 3 15.439 3.439C15 3.879 15 4.586 15 6C15 7.414 15 8.121 15.439 8.561Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M15.439 20.561C15.879 21 16.586 21 18 21C19.414 21 20.121 21 20.561 20.561C21 20.121 21 19.414 21 18C21 16.586 21 15.879 20.561 15.439C20.121 15 19.414 15 18 15C16.586 15 15.879 15 15.439 15.439C15 15.879 15 16.586 15 18C15 19.414 15 20.121 15.439 20.561Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M3.439 20.561C3.879 21 4.586 21 6 21C7.414 21 8.121 21 8.561 20.561C9 20.121 9 19.414 9 18C9 16.586 9 15.879 8.561 15.439C8.121 15 7.414 15 6 15C4.586 15 3.879 15 3.439 15.439C3 15.879 3 16.586 3 18C3 19.414 3 20.121 3.439 20.561Z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M12 6H9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M15 18H12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M18 12L18 9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M6 15L6 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        }
        barOpacities={["opacity-[0.536]", "opacity-[0.527]", "opacity-[0.517]"]}
        spinner={
          <svg
            className="size-4 shrink-0 rotate-[257.94deg] overflow-clip"
            fill="none"
            stroke="#8B5CF6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Generating</title>
            <path
              d="M21 12C21 15.899 18.489 19.354 14.781 20.559C11.073 21.764 7.01 20.444 4.719 17.29C2.427 14.135 2.427 9.864 4.719 6.709C7.011 3.555 11.073 2.235 14.781 3.44"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        }
        title="Generating changelog..."
        wrapperClassName="top-73.5 left-5.5 h-49.25 w-78.5"
      />
      <AssetTile
        badge="tweet"
        badgeIcon={
          <svg
            className="size-3 shrink-0 overflow-clip"
            fill="#171717"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Tweet</title>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        }
        barOpacities={["opacity-[0.527]", "opacity-[0.536]", "opacity-[0.547]"]}
        spinner={<Spinner rotationClass="rotate-[17.9888deg]" />}
        title="Generating content..."
        wrapperClassName="top-73.5 left-88.25 h-44.25 w-63"
      />
    </div>
  );
}
