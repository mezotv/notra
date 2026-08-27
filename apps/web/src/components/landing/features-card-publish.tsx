import {
  FEATURES_CLI_TOOL,
  FEATURES_MCP_TOOL,
  FEATURES_PERMISSIONS,
} from "@/constants/landing/features";
import type {
  FeaturesPermission,
  FeaturesPermissionLevel,
} from "@/types/landing/features";

function Segment({
  label,
  tone,
}: {
  label: string;
  tone: FeaturesPermissionLevel | null;
}) {
  if (tone === "write") {
    return (
      <div className="relative flex min-w-7 items-center justify-center rounded-md px-2.5 py-1">
        <div className="absolute inset-0 rounded-md bg-[oklab(76.9%_0.064_0.177/10%)] [box-shadow:oklab(76.9%_0.064_0.177/30%)_0rem_0rem_0rem_0.0625rem,#0000001A_0rem_0.25rem_0.625rem,#0000001A_0rem_0.0625rem_0.125rem_-0.0625rem]" />
        <div className="relative content-center text-center font-sans text-[0.875rem] leading-[142.857%] font-medium text-[oklch(66.6%_0.179_58.3)]">
          {label}
        </div>
      </div>
    );
  }
  if (tone === "read") {
    return (
      <div className="relative flex min-w-7 items-center justify-center rounded-md px-2.5 py-1">
        <div className="absolute inset-0 rounded-md bg-[oklab(69.6%_-0.162_0.051/10%)] [box-shadow:oklab(69.6%_-0.162_0.051/30%)_0rem_0rem_0rem_0.0625rem,#0000001A_0rem_0.25rem_0.625rem,#0000001A_0rem_0.0625rem_0.125rem_-0.0625rem]" />
        <div className="relative content-center text-center font-sans text-[0.875rem] leading-[142.857%] font-medium text-[oklch(59.6%_0.145_163.2)]">
          {label}
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-w-7 items-center justify-center rounded-md px-2.5 py-1">
      <div className="content-center text-center font-sans text-[0.875rem] leading-[142.857%] font-medium text-[#737373]">
        {label}
      </div>
    </div>
  );
}

function PermissionRow({
  permission,
  withBorder,
}: {
  permission: FeaturesPermission;
  withBorder: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3 ${
        withBorder ? "border-b border-b-[#E5E5E5]" : ""
      }`}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="font-sans text-[0.875rem] leading-[142.857%] font-medium text-[#171717]">
          {permission.name}
        </div>
        <div className="font-sans text-[0.75rem] leading-[133.333%] text-[#737373]">
          {permission.description}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#E5E5E5] bg-[#F5F5F566] p-0.5">
        <Segment label="None" tone={null} />
        <Segment
          label="Read"
          tone={permission.active === "read" ? "read" : null}
        />
        <Segment
          label="Write"
          tone={permission.active === "write" ? "write" : null}
        />
      </div>
    </div>
  );
}

function ViewDocs() {
  return (
    <div className="mt-auto flex w-fit items-center gap-1">
      <div className="font-sans text-[0.75rem] leading-[133.333%] font-medium text-[#737373]">
        View docs
      </div>
      <svg
        className="size-3 shrink-0 overflow-clip"
        fill="none"
        stroke="oklch(55.6% 0 0)"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Open</title>
        <path
          d="M9 6.65C9 6.65 15.938 6.108 16.915 7.085C17.892 8.062 17.35 15 17.35 15M16.5 7.5L6.5 17.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

export function FeaturesCardPublish() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute top-42 left-51 grid h-88 w-164.5 gap-4 overflow-clip rounded-2xl bg-white p-4 [box-shadow:#1E1E1E1A_0rem_0.125rem_1.25rem,#1717171A_0rem_0rem_0rem_0.0625rem] lg:top-21.5">
        <div>
          <div className="flex flex-col gap-2">
            <div className="font-sans text-[1.125rem] leading-[133.333%] font-medium text-[#171717]">
              Edit API Key
            </div>
          </div>
          <div className="py-4">
            <div className="mb-4 flex w-full flex-col gap-2">
              <div className="flex w-full items-center gap-2">
                <div className="inline-block font-sans text-[0.875rem] leading-[137.5%] font-medium text-[#171717]">
                  Name
                </div>
                <div className="-ml-1 font-sans text-[0.875rem] leading-[137.5%] font-medium text-[#EF4444]">
                  *
                </div>
              </div>
              <div className="flex h-8 w-full min-w-0 items-center overflow-clip rounded-lg border border-[#E5E5E5] px-2.5 py-1">
                <div className="h-fit w-full overflow-clip">
                  <div className="line-clamp-1 font-sans text-[0.875rem] leading-[142.857%] text-[#171717]">
                    CI/CD pipeline
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4 flex w-full flex-col gap-2">
              <div className="flex w-full items-center gap-2">
                <div className="inline-block font-sans text-[0.875rem] leading-[137.5%] font-medium text-[#171717]">
                  Permission
                </div>
                <div className="-ml-1 font-sans text-[0.875rem] leading-[137.5%] font-medium text-[#EF4444]">
                  *
                </div>
              </div>
              <div className="w-full min-w-min overflow-clip rounded-xl border border-[#E5E5E5] bg-white">
                {FEATURES_PERMISSIONS.map((permission, index) => (
                  <PermissionRow
                    key={permission.name}
                    permission={permission}
                    withBorder={index < FEATURES_PERMISSIONS.length - 1}
                  />
                ))}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="w-full content-center font-sans text-[0.875rem] leading-[137.5%] font-medium text-[#171717]">
                Expiration
              </div>
              <div className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-[#E5E5E5] py-2 pr-2 pl-2.5">
                <div className="grow basis-[0%] content-center font-sans text-[0.875rem] leading-[142.857%] text-[#171717] capitalize">
                  never
                </div>
                <svg
                  className="size-4 shrink-0 overflow-clip"
                  fill="none"
                  stroke="#737373"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Toggle</title>
                  <path
                    d="M18 14C18 14 13.581 19 12 19C10.419 19 6 14 6 14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 10C18 10 13.581 5 12 5C10.419 5 6 10 6 10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>
          <div className="-mx-4 -mb-4 flex justify-end gap-2 rounded-b-xl border-t border-t-[#E5E5E5] bg-[#F5F5F580] p-4">
            <div className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#E5E5E5] bg-white px-2.5">
              <div className="w-max shrink-0 text-center font-sans text-[0.875rem] leading-[142.857%] font-medium text-[#171717]">
                Cancel
              </div>
            </div>
            <div className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[1.25rem] border border-[#00000000] bg-[#8B5CF6] px-2.5 [box-shadow:#FFFFFF14_0rem_0rem_0rem_0.15625rem_inset]">
              <div className="w-max shrink-0 text-center font-sans text-[0.875rem] leading-[142.857%] font-medium text-[#FEFEFE]">
                Save Changes
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md border border-[#00000000]">
          <svg
            className="size-4 shrink-0 overflow-clip"
            fill="none"
            stroke="#171717"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Close</title>
            <path
              d="M18 6L6.001 17.999M17.999 18L6 6.001"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
      <div className="absolute top-51.5 -left-65.75 flex w-110.25 flex-col gap-4 rounded-2xl border border-[#1717171A] bg-white p-4 [box-shadow:#1717170D_0rem_0.1875rem_0.9375rem_-0.125rem] lg:top-31.5">
        <div className="flex grow basis-[0%] flex-col gap-4">
          <div className="flex items-center justify-end self-stretch">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white [box-shadow:#0000000A_0rem_0.125rem_0.375rem,#0000000D_0rem_0rem_0rem_0.0625rem]">
              <svg
                className="size-5 shrink-0 overflow-clip"
                fill="none"
                stroke="#8B5CF6"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>MCP</title>
                <path
                  d="M17.854 12.16C17.471 12.611 16.763 12.614 16.317 12.167L11.833 7.684C11.386 7.237 11.389 6.529 11.84 6.146L13.071 5.099C13.956 4.347 15.035 3.848 16.204 3.651L16.929 3.529C17.614 3.413 18.334 3.652 18.848 4.166L19.834 5.153C20.348 5.666 20.587 6.386 20.471 7.071L20.349 7.796C20.152 8.965 19.653 10.044 18.901 10.929L17.854 12.16Z"
                  strokeWidth="1.5"
                />
                <path
                  d="M19.5 4.5L21.5 2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M2.5 21.5L4.5 19.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M6.146 11.84C6.529 11.389 7.237 11.386 7.684 11.833L12.167 16.317C12.614 16.763 12.611 17.471 12.16 17.854L10.929 18.901C10.044 19.653 8.965 20.152 7.796 20.349L7.071 20.471C6.386 20.587 5.666 20.348 5.153 19.834L4.166 18.848C3.652 18.334 3.413 17.614 3.529 16.929L3.651 16.204C3.848 15.035 4.347 13.956 5.099 13.071L6.146 11.84Z"
                  strokeWidth="1.5"
                />
                <path
                  d="M8.5 12.5L10.5 10.5M11.5 15.5L13.5 13.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-1 flex flex-wrap justify-end text-right font-sans text-[0.875rem] leading-[142.857%] font-medium text-[#0A0A0A]">
              {FEATURES_MCP_TOOL.title}
            </div>
            <div className="flex flex-wrap justify-end text-right font-sans text-[0.75rem] leading-[162.5%] text-[#737373]">
              {FEATURES_MCP_TOOL.description}
            </div>
          </div>
          <div className="flex flex-col items-end justify-center self-stretch">
            <ViewDocs />
          </div>
        </div>
      </div>
      <div className="absolute top-98 -left-42 flex w-86.5 flex-col items-end justify-center gap-4 rounded-2xl border border-[#1717171A] bg-white p-4 [box-shadow:#1717170D_0rem_0.1875rem_0.9375rem_-0.125rem] lg:top-78">
        <div className="flex grow basis-[0%] flex-col gap-4 self-stretch">
          <div className="flex items-start justify-end self-stretch">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white [box-shadow:#0000000A_0rem_0.125rem_0.375rem,#0000000D_0rem_0rem_0rem_0.0625rem]">
              <svg
                className="size-5 shrink-0 overflow-clip"
                fill="none"
                stroke="#8B5CF6"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>CLI</title>
                <path
                  d="M14 4H10C6.229 4 4.343 4 3.172 5.172C2 6.343 2 8.229 2 12C2 15.771 2 17.657 3.172 18.828C4.343 20 6.229 20 10 20H14C17.771 20 19.657 20 20.828 18.828C22 17.657 22 15.771 22 12C22 8.229 22 6.343 20.828 5.172C19.657 4 17.771 4 14 4Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 9L8.84 10.586C9.613 11.252 10 11.586 10 12C10 12.414 9.613 12.748 8.84 13.414L7 15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M13 16H17"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </div>
          <div>
            <div className="mb-1 flex flex-wrap justify-end text-right font-sans text-[0.875rem] leading-[142.857%] font-medium text-[#0A0A0A]">
              {FEATURES_CLI_TOOL.title}
            </div>
            <div className="flex flex-wrap justify-end text-right font-sans text-[0.75rem] leading-[162.5%] text-[#737373]">
              {FEATURES_CLI_TOOL.description}
            </div>
          </div>
          <div className="flex flex-col items-end self-stretch">
            <ViewDocs />
          </div>
        </div>
      </div>
    </div>
  );
}
