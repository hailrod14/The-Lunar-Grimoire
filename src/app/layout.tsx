import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Pixelify_Sans, VT323 } from "next/font/google";
import Script from "next/script";
import { Starfield } from "@/components/pixel/Starfield";
import "./globals.css";

const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixelify" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323" });
/** Designed by the Braille Institute so every letter is distinct, for tired eyes and low vision. */
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--font-atkinson" });

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
    <html lang="en" className={`${pixelify.variable} ${vt323.variable} ${atkinson.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        {/* Apply the last theme and reading settings before the first paint, so nothing flashes. */}
        <Script id="theme" strategy="beforeInteractive">
          {`try{var r=document.documentElement,t=localStorage.getItem("lunar-grimoire:theme"),l=localStorage.getItem("lunar-grimoire:lettering"),z=localStorage.getItem("lunar-grimoire:text-size");if(t&&t!=="midnight")r.dataset.theme=t;if(l)r.dataset.lettering=l;if(z)r.dataset.textSize=z}catch(e){}`}
        </Script>
        <Starfield />
        {children}
      </body>
    </html>
  );
}
