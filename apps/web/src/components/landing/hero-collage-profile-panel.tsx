import { ArrowDown01Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { HERO_COLLAGE_PROFILE } from "@/constants/landing/hero-collage";

function FieldValue({ value }: { value: string }) {
  return <Input defaultValue={value} />;
}

export function HeroCollageProfilePanel() {
  return (
    <div className="-mx-26 relative z-20 w-[30rem] shrink-0 self-center rounded-3xl border border-black/5 bg-background px-12 py-5 shadow-[0_0.125rem_4.4375rem_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out lg:motion-safe:hover:scale-[1.02] dark:border-white/10">
      <div className="mb-6 space-y-1">
        <h3 className="font-bold font-sans text-[1.375rem] text-foreground leading-[1.2] tracking-[-0.046875rem]">
          {HERO_COLLAGE_PROFILE.heading}
        </h3>
        <p className="text-muted-foreground text-sm leading-[1.5]">
          {HERO_COLLAGE_PROFILE.subhead}
        </p>
      </div>

      <div className="space-y-6">
        <TitleCard heading={HERO_COLLAGE_PROFILE.sectionCompany}>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>{HERO_COLLAGE_PROFILE.companyNameLabel}</Label>
              <FieldValue value={HERO_COLLAGE_PROFILE.companyNameValue} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-profile-website">
                {HERO_COLLAGE_PROFILE.websiteLabel}
              </Label>
              <div className="flex w-full flex-row items-center overflow-hidden rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                <span className="border-input border-r px-2.5 py-1.5 text-muted-foreground text-sm">
                  {HERO_COLLAGE_PROFILE.websitePrefix}
                </span>
                <input
                  className="w-full min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                  defaultValue={HERO_COLLAGE_PROFILE.websiteValue}
                  id="hero-profile-website"
                  inputMode="url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{HERO_COLLAGE_PROFILE.descriptionLabel}</Label>
              <FieldValue value={HERO_COLLAGE_PROFILE.descriptionValue} />
            </div>
          </div>
        </TitleCard>

        <TitleCard heading={HERO_COLLAGE_PROFILE.sectionAudience}>
          <div className="space-y-2">
            <Label>{HERO_COLLAGE_PROFILE.audienceLabel}</Label>
            <FieldValue value={HERO_COLLAGE_PROFILE.audienceValue} />
          </div>
        </TitleCard>

        <TitleCard heading={HERO_COLLAGE_PROFILE.sectionTone}>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    aria-hidden="true"
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-sm">
                  {HERO_COLLAGE_PROFILE.toneProfileLabel}
                </span>
              </div>
              <div className="flex h-8 w-fit items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm">
                {HERO_COLLAGE_PROFILE.toneProfileValue}
                <HugeiconsIcon
                  className="size-4 text-muted-foreground"
                  icon={UnfoldMoreIcon}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <span className="size-5 rounded-full border-2 border-muted-foreground/30" />
                <span className="text-sm">
                  {HERO_COLLAGE_PROFILE.customToneLabel}
                </span>
              </div>
              <Input
                className="opacity-50"
                placeholder={HERO_COLLAGE_PROFILE.customTonePlaceholder}
              />
            </div>

            <div className="space-y-2 pt-4">
              <Label>{HERO_COLLAGE_PROFILE.languageLabel}</Label>
              <div className="flex h-8 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">
                    {HERO_COLLAGE_PROFILE.languageFlag}
                  </span>
                  {HERO_COLLAGE_PROFILE.languageValue}
                </span>
                <HugeiconsIcon
                  className="size-4 text-muted-foreground"
                  icon={ArrowDown01Icon}
                />
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label>{HERO_COLLAGE_PROFILE.customInstructionsLabel}</Label>
              <Input
                placeholder={HERO_COLLAGE_PROFILE.customInstructionsPlaceholder}
              />
            </div>
          </div>
        </TitleCard>
      </div>
    </div>
  );
}
