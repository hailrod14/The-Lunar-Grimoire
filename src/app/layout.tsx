import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, VT323 } from "next/font/google";
import { Starfield } from "@/components/pixel/Starfield";
import "./globals.css";

const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixelify" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323" });

export const metadata: Metadata = {
  title: "The Lunar Grimoire",
  description: "A witchy, pixel-art cycle, potion & mood tracker — your private celestial grimoire.",
  applicationName: "The Lunar Grimoire",
  appleWebApp: { capable: true, title: "Grimoire", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0f0d2e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pixelify.variable} ${vt323.variable}`}>
      <body className="antialiased">
        <Starfield />
        {children}
      </body>
    </html>
  );
}
