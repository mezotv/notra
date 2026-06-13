import { Composition } from "remotion";
import { ImageGenLaunch } from "./image-gen-launch";
import { BANNER, GALLERY, THUMBNAIL, TOTAL_DURATION, VIDEO } from "./lib/theme";
import { ASSETS_LOOP_DURATION, AssetsLoop } from "./scenes/assets-loop";
import { GalleryBanner } from "./scenes/gallery-banner";
import { GalleryBrandRepo } from "./scenes/gallery-brand-repo";
import { GalleryCloser } from "./scenes/gallery-closer";
import { GalleryGeneric } from "./scenes/gallery-generic";
import { GalleryHero } from "./scenes/gallery-hero";
import { GalleryPaste } from "./scenes/gallery-paste";
import { PAPER_LOOP_DURATION, PaperPasteLoop } from "./scenes/paper-paste-loop";
import { EDIT_LOOP_DURATION, TextEditLoop } from "./scenes/text-edit-loop";
import { YoutubeThumbnail } from "./scenes/youtube-thumbnail";

const GALLERY_CARDS = [
  { id: "GalleryHero", component: GalleryHero },
  { id: "GalleryGeneric", component: GalleryGeneric },
  { id: "GalleryBrandRepo", component: GalleryBrandRepo },
  { id: "GalleryPaste", component: GalleryPaste },
  { id: "GalleryCloser", component: GalleryCloser },
] as const;

export function RemotionRoot() {
  return (
    <>
      <Composition
        component={ImageGenLaunch}
        durationInFrames={TOTAL_DURATION}
        fps={VIDEO.fps}
        height={VIDEO.height}
        id="ImageGenLaunch"
        width={VIDEO.width}
      />
      <Composition
        component={AssetsLoop}
        durationInFrames={ASSETS_LOOP_DURATION}
        fps={VIDEO.fps}
        height={VIDEO.height}
        id="MarketingAssetsLoop"
        width={VIDEO.width}
      />
      <Composition
        component={PaperPasteLoop}
        durationInFrames={PAPER_LOOP_DURATION}
        fps={VIDEO.fps}
        height={VIDEO.height}
        id="MarketingPaperLoop"
        width={VIDEO.width}
      />
      <Composition
        component={TextEditLoop}
        durationInFrames={EDIT_LOOP_DURATION}
        fps={VIDEO.fps}
        height={VIDEO.height}
        id="MarketingEditLoop"
        width={VIDEO.width}
      />
      {GALLERY_CARDS.map((card) => (
        <Composition
          component={card.component}
          durationInFrames={1}
          fps={VIDEO.fps}
          height={GALLERY.height}
          id={card.id}
          key={card.id}
          width={GALLERY.width}
        />
      ))}
      <Composition
        component={GalleryBanner}
        durationInFrames={1}
        fps={VIDEO.fps}
        height={BANNER.height}
        id="YoutubeBanner"
        width={BANNER.width}
      />
      <Composition
        component={YoutubeThumbnail}
        durationInFrames={1}
        fps={VIDEO.fps}
        height={THUMBNAIL.height}
        id="YoutubeThumbnail"
        width={THUMBNAIL.width}
      />
    </>
  );
}
