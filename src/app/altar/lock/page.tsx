import type { Metadata } from "next";
import { CombinationLockDemo } from "../Demos";

export const metadata: Metadata = { title: "Lock · Design Altar" };

/** The sealed cover's combination lock, on its own for checking at phone size. */
export default function LockPreview() {
  return <CombinationLockDemo />;
}
