import type { MetadataRoute } from "next";

export const dynamic = "force-static";

// Paths inside the manifest aren't rewritten by Next, so add the GitHub Pages prefix here.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Lunar Grimoire",
    short_name: "Grimoire",
    description: "A witchy, pixel-art cycle, potion & mood tracker. Your private celestial grimoire.",
    id: `${base}/`,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#07061a",
    theme_color: "#0f0d2e",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${base}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
