import { Img, staticFile } from "../remotion";

interface RealImageProps {
  width: number;
}

export function RealImage({ width }: RealImageProps) {
  return (
    <Img
      src={staticFile("emdash-image.svg")}
      style={{
        width,
        height: width * (630 / 1200),
        display: "block",
        objectFit: "cover",
      }}
    />
  );
}
