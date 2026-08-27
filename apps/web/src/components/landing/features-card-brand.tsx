export function FeaturesCardBrand() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute top-28.5 left-9.5 isolate flex h-84 w-135.25 flex-col overflow-clip rounded-2xl border-t border-r border-b border-l border-t-[#E5E5E5CC] border-r-[#E5E5E5CC] border-b-[#E5E5E566] border-l-[#E5E5E5CC] bg-[#F5F5F5CC] [box-shadow:#0000000D_0rem_0.25rem_0.625rem]">
        <div className="flex items-start justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 grow basis-[0%] items-center gap-2">
            <div className="line-clamp-1 min-w-0 grow basis-[0%] font-sans text-[1.125rem] leading-[155.556%] font-medium text-[#171717]">
              Tone &amp; Language
            </div>
          </div>
        </div>
        <div className="grow basis-[0%] rounded-t-lg border-t border-t-[#E5E5E599] bg-white px-4 py-3">
          <div className="w-fit min-w-min">
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]">
                  <svg
                    className="size-3 shrink-0 overflow-clip"
                    fill="none"
                    stroke="oklch(99.7% 0 0)"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Selected</title>
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="font-sans text-[0.875rem] leading-[142.857%] text-[#171717]">
                  Tone Profile
                </div>
              </div>
              <div className="mb-3 flex h-8 w-fit items-center justify-between gap-1.5 rounded-lg border border-[#E5E5E5] py-2 pr-2 pl-2.5">
                <div className="grow basis-[0%] content-center font-sans text-[0.875rem] leading-[142.857%] text-[#171717]">
                  Professional
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
            <div className="pt-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="size-5 shrink-0 rounded-full border-2 border-[#7373734D]" />
                  <div className="font-sans text-[0.875rem] leading-[142.857%] text-[#171717]">
                    Custom Tone
                  </div>
                </div>
                <div className="inline-flex h-8 w-full items-center overflow-clip rounded-lg border border-[#E5E5E5] bg-[#E5E5E580] px-2.5 py-1 opacity-50">
                  <div className="h-[1.03125rem] w-137 shrink-0 font-sans text-sm/4.5 text-[#737373]">
                    Add custom tone notes...
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4">
            <div>
              <div className="mb-2 content-center font-sans text-[0.875rem] leading-[100%] font-medium text-[#171717]">
                Custom Instructions
              </div>
              <div className="flex min-h-25 w-full resize-y overflow-clip rounded-lg border border-[#E5E5E5] px-2.5 py-2">
                <div className="h-10 w-137 shrink-0 font-sans text-sm/5 text-[#737373]">
                  Add any specific instructions for AI-generated content (e.g.,
                  avoid certain phrases, always mention specific features, etc.)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
