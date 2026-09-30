import Link from "next/link";
import { PixelMoon } from "@/components/sprites/PixelMoon";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="animate-float">
        <PixelMoon phase={0.12} variant="tide" size={128} resolution={24} title="A golden crescent moon" />
      </div>
      <h1 className="pixel-title text-4xl">The Lunar Grimoire</h1>
      <p className="font-journal text-2xl text-silver-300">The grimoire is still being bound…</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/mockup/" className="pixel-button pixel-button--gold">
          Try the layout mockup
        </Link>
        <Link href="/altar/" className="pixel-button pixel-button--ghost">
          Design Altar
        </Link>
      </div>
    </main>
  );
}
