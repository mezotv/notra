import type { Metadata } from "next";
import { ImageStudioClient } from "./page-client";

export const metadata: Metadata = {
  title: "Image Studio",
};

export default function ImageStudioPage() {
  return <ImageStudioClient />;
}
