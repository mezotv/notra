import type { Metadata } from "next";
import { ImageStudioClient } from "./page-client";

export const metadata: Metadata = {
  title: "Image Studio",
};

export default function ImageStudioPage() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0d0d0d",
        color: "white",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        zIndex: 50,
      }}
    >
      <ImageStudioClient />
    </div>
  );
}
