import type { Metadata } from "next";
import { CoverDemo } from "../Demos";

export const metadata: Metadata = { title: "Cover · Design Altar" };

/** The closed book with stickers, on its own for checking at phone size. */
export default function CoverPreview() {
  return (
    <main className="mx-auto max-w-md p-4">
      <CoverDemo />
    </main>
  );
}
