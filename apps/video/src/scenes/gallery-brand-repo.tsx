import { DashboardShot } from "../components/dashboard-shot";
import { GalleryCard, Media } from "../components/gallery-card";
import { GALLERY_COPY } from "../lib/copy";

export function GalleryBrandRepo() {
  const copy = GALLERY_COPY.brandRepo;

  return (
    <GalleryCard
      headlineAccent={copy.headlineAccent}
      headlinePost={copy.headlinePost}
      headlinePre={copy.headlinePre}
      layout="split"
      mediaSide="left"
      sub={copy.sub}
      visual={
        <Media height={920} scale={0.82} width={1600}>
          <DashboardShot state="generating" />
        </Media>
      }
    />
  );
}
