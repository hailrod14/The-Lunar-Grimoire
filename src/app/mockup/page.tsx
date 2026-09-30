import type { Metadata } from "next";
import { Mockup } from "./Mockup";

export const metadata: Metadata = { title: "Layout Mockup · The Lunar Grimoire" };

export default function MockupPage() {
  return <Mockup />;
}
