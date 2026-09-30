import type { NextConfig } from "next";

// On GitHub Pages the site lives under /The-Lunar-Grimoire; locally it lives at /.
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH so assets resolve correctly.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
