import { SITE_DESCRIPTION } from "@/utils/metadata";

export function GET() {
  return Response.json({
    name: "Notra",
    short_name: "Notra",
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    theme_color: "#F6F3F1",
    background_color: "#F6F3F1",
    display: "standalone",
  });
}
