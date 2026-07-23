import { HeroCollageContentPanel } from "@/components/landing/hero-collage-content-panel";
import { HeroCollageEventsPanel } from "@/components/landing/hero-collage-events-panel";
import { HeroCollageProfilePanel } from "@/components/landing/hero-collage-profile-panel";

export function HeroCollage() {
  return (
    <div className="@container w-full lg:w-[73.25rem]">
      <div className="relative h-[135cqw] w-full overflow-hidden lg:h-auto lg:overflow-visible">
        <div className="absolute top-0 left-[calc(50cqw-36.625rem*min(1,calc(100cqw/34rem)))] w-[73.25rem] origin-top-left [transform:scale(min(1,calc(100cqw/34rem)))] lg:left-0 lg:[transform:scale(min(1,calc(100cqw/73.25rem)))]">
          <div className="relative flex items-end justify-center">
            <HeroCollageContentPanel />
            <HeroCollageProfilePanel />
            <HeroCollageEventsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
