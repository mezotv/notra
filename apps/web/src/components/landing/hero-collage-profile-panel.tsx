"use client";

import { Input } from "@notra/ui/components/ui/input";
import { Label } from "@notra/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { TitleCard } from "@notra/ui/components/ui/title-card";
import { useState } from "react";

import {
  HERO_COLLAGE_LANGUAGE_OPTIONS,
  HERO_COLLAGE_PROFILE,
  HERO_COLLAGE_TONE_OPTIONS,
} from "@/constants/landing/hero-collage";

function FieldValue({ value }: { value: string }) {
  return <Input defaultValue={value} />;
}

export function HeroCollageProfilePanel() {
  const [isCustomTone, setIsCustomTone] = useState(false);
  const [toneProfile, setToneProfile] = useState(
    HERO_COLLAGE_PROFILE.toneProfileValue
  );
  const [language, setLanguage] = useState(HERO_COLLAGE_PROFILE.languageValue);

  return (
    <div className="bg-background relative z-20 -mx-26 w-[30rem] shrink-0 self-center rounded-3xl border border-black/5 px-12 py-5 shadow-none transition-transform duration-300 ease-out lg:shadow-[0_0.125rem_4.4375rem_rgba(0,0,0,0.1)] lg:motion-safe:hover:scale-[1.02] dark:border-white/10">
      <div className="mb-6 space-y-1">
        <h3 className="text-foreground font-sans text-[1.375rem] leading-[1.2] font-bold tracking-[-0.046875rem]">
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
              <div className="border-input focus-within:border-ring focus-within:ring-ring/50 flex w-full flex-row items-center overflow-hidden rounded-lg border transition-colors focus-within:ring-[3px]">
                <span className="border-input text-muted-foreground border-r px-2.5 py-1.5 text-sm">
                  {HERO_COLLAGE_PROFILE.websitePrefix}
                </span>
                <input
                  className="placeholder:text-muted-foreground w-full min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none"
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
            <div aria-label="Tone mode" className="space-y-3" role="radiogroup">
              <label className="flex w-fit cursor-pointer items-center gap-2 text-left">
                <input
                  checked={!isCustomTone}
                  className="sr-only"
                  name="hero-tone-mode"
                  onChange={() => setIsCustomTone(false)}
                  type="radio"
                  value="profile"
                />
                <span
                  className={
                    isCustomTone
                      ? "border-muted-foreground/30 size-5 rounded-full border-2"
                      : "bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full"
                  }
                >
                  {isCustomTone ? null : (
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
                  )}
                </span>
                <span className="text-sm">
                  {HERO_COLLAGE_PROFILE.toneProfileLabel}
                </span>
              </label>
              <Select
                disabled={isCustomTone}
                onValueChange={(value) => {
                  if (value) {
                    setToneProfile(value);
                  }
                }}
                value={toneProfile}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  className="min-w-30"
                >
                  {HERO_COLLAGE_TONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <label className="flex w-fit cursor-pointer items-center gap-2 pt-4 text-left">
                <input
                  checked={isCustomTone}
                  className="sr-only"
                  name="hero-tone-mode"
                  onChange={() => setIsCustomTone(true)}
                  type="radio"
                  value="custom"
                />
                <span
                  className={
                    isCustomTone
                      ? "bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full"
                      : "border-muted-foreground/30 size-5 rounded-full border-2"
                  }
                >
                  {isCustomTone ? (
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
                  ) : null}
                </span>
                <span className="text-sm">
                  {HERO_COLLAGE_PROFILE.customToneLabel}
                </span>
              </label>
              <Input
                className="transition-[color,background-color,border-color,box-shadow,opacity] duration-200 ease-out motion-reduce:transition-none"
                disabled={!isCustomTone}
                placeholder={HERO_COLLAGE_PROFILE.customTonePlaceholder}
              />
            </div>

            <div className="space-y-2 pt-4">
              <Label>{HERO_COLLAGE_PROFILE.languageLabel}</Label>
              <Select
                onValueChange={(value) => {
                  if (value) {
                    setLanguage(value);
                  }
                }}
                value={language}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  align="start"
                  alignItemWithTrigger={false}
                  className="min-w-0"
                >
                  {HERO_COLLAGE_LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="text-base leading-none">
                        {option.flag}
                      </span>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
